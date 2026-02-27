import { perfEnd, perfStart } from "@frontend/utils/perf";

import type { MutationTopic } from "@backend/api";
import type { EntityType } from "@backend/schemas/AuditLog";
import type { Milestone } from "@backend/schemas/Milestone";

import { useAssignmentStore } from "./stores/assignmentStore";
import { useAuditLogStore } from "./stores/auditLogStore";
import { useLabelStore } from "./stores/labelStore";
import { useMilestoneStore } from "./stores/milestoneStore";
import { usePersonStore } from "./stores/personStore";
import { usePlanningStore } from "./stores/planningStore";
import { useProjectStore } from "./stores/projectStore";
import { useSyncStatusStore } from "./stores/syncStatusStore";
import { useTaskStore } from "./stores/taskStore";

const HEARTBEAT_INTERVAL_MS = 10_000;
const PONG_TIMEOUT_MS = 30_000;
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;

let hasSyncStarted = false;

function getReconnectDelayMs(attempt: number) {
  const expDelay = Math.min(
    RECONNECT_MAX_DELAY_MS,
    RECONNECT_BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1)
  );
  return Math.floor(expDelay * (0.8 + Math.random() * 0.4));
}

export function sync() {
  if (hasSyncStarted) {
    return;
  }
  hasSyncStarted = true;

  const wshost =
    window.location.hostname === "localhost"
      ? "ws://localhost:3000/ws"
      : `wss://${window.location.host + import.meta.env.BASE_URL}ws`;
  const {
    setConnecting,
    setConnected,
    setDisconnected,
    setReconnecting,
    setStale,
    markMessage,
    markPong,
    state: syncState,
  } = useSyncStatusStore();

  const { setLabel, deleteLabel, loadLabels } = useLabelStore();
  const { setPerson, deletePerson, loadPersons } = usePersonStore();
  const { setProject, deleteProject, loadProjects } = useProjectStore();
  const {
    setMilestone,
    deleteMilestone,
    deleteMilestonesByProjectId,
    loadMilestones,
  } = useMilestoneStore();
  const {
    setTask,
    deleteTask,
    deleteTasksByProjectId,
    applyMilestoneDueDateToTasks,
    clearMilestoneFromTasks,
    loadTasks,
  } = useTaskStore();
  const {
    setPlanning,
    deletePlanning,
    deletePlanningsByTaskId,
    deletePlanningsByTaskIds,
    loadPlannings,
  } = usePlanningStore();
  const {
    setAssignment,
    deleteAssignment,
    deleteAssignmentsByTaskId,
    deleteAssignmentsByTaskIds,
    deleteAssignmentsByPersonId,
    loadAssignments,
  } = useAssignmentStore();
  const { addAuditLog } = useAuditLogStore();

  let ws: WebSocket | null = null;
  let reconnectAttempt = 0;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let watchdogTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let hasConnectedOnce = false;

  function clearTimers() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (watchdogTimer) {
      clearInterval(watchdogTimer);
      watchdogTimer = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  async function resyncAll() {
    await Promise.all([
      loadLabels(),
      loadPersons(),
      loadProjects(),
      loadMilestones(),
      loadTasks(),
      loadPlannings(),
      loadAssignments(),
    ]);
  }

  function startHeartbeat() {
    if (!ws) {
      return;
    }
    heartbeatTimer = setInterval(() => {
      if (ws?.readyState !== WebSocket.OPEN) {
        return;
      }
      ws.send(
        JSON.stringify({
          topic: "ping",
          timeStamp: new Date().toISOString(),
        })
      );
    }, HEARTBEAT_INTERVAL_MS);

    watchdogTimer = setInterval(() => {
      const lastPongAt = syncState.lastPongAt;
      if (!lastPongAt) {
        return;
      }
      if (Date.now() - lastPongAt > PONG_TIMEOUT_MS) {
        setStale();
        ws?.close();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  function scheduleReconnect() {
    if (reconnectTimer) {
      return;
    }
    reconnectAttempt += 1;
    setReconnecting(reconnectAttempt);
    const delay = getReconnectDelayMs(reconnectAttempt);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function handleDisconnect(reason: string) {
    clearTimers();
    setDisconnected(reason);
    scheduleReconnect();
  }
  const mutationHandlers: Record<
    EntityType,
    {
      onCreateOrUpdate: (after: any) => void;
      onDelete: (id: string) => void | Promise<void>;
    }
  > = {
    LABEL: {
      onCreateOrUpdate: setLabel,
      onDelete: deleteLabel,
    },
    PERSON: {
      onCreateOrUpdate: setPerson,
      onDelete: async (id: string) => {
        await deleteAssignmentsByPersonId(id);
        deletePerson(id);
      },
    },
    PROJECT: {
      onCreateOrUpdate: setProject,
      onDelete: async (id: string) => {
        const deletedTaskIds = deleteTasksByProjectId(id);
        await deleteAssignmentsByTaskIds(deletedTaskIds);
        await deletePlanningsByTaskIds(deletedTaskIds);
        deleteMilestonesByProjectId(id);

        deleteProject(id);
      },
    },
    MILESTONE: {
      onCreateOrUpdate: (after: Milestone) => {
        setMilestone(after);
        applyMilestoneDueDateToTasks(after.id, after.dueDate ?? null);
      },
      onDelete: (id: string) => {
        clearMilestoneFromTasks(id);
        deleteMilestone(id);
      },
    },
    TASK: {
      onCreateOrUpdate: setTask,
      onDelete: async (id: string) => {
        const taskDeleteToken = perfStart("sync:task.delete.cleanup", {
          taskId: id,
        });
        await deletePlanningsByTaskId(id);
        await deleteAssignmentsByTaskId(id);

        deleteTask(id);
        perfEnd(taskDeleteToken, undefined, 1);
      },
    },
    PLANNING: {
      onCreateOrUpdate: setPlanning,
      onDelete: deletePlanning,
    },
    ASSIGNMENT: {
      onCreateOrUpdate: setAssignment,
      onDelete: deleteAssignment,
    },
  };

  function connect() {
    setConnecting();
    ws = new WebSocket(wshost);

    ws.onopen = async () => {
      reconnectAttempt = 0;
      setConnected();
      clearTimers();
      startHeartbeat();

      if (hasConnectedOnce) {
        await resyncAll();
      }
      hasConnectedOnce = true;
    };

    ws.onerror = () => {
      handleDisconnect("socket_error");
    };

    ws.onclose = () => {
      handleDisconnect("socket_closed");
    };

    ws.onmessage = async (event) => {
      markMessage();
      const message = JSON.parse(event.data);
      if (message.topic === "pong") {
        markPong();
        return;
      }
      if (message.topic === "mutations") {
        const m = message as MutationTopic;
        const entityType = m.entityType;
        const action = m.action;
        if (action === "CREATE" || action === "UPDATE") {
          mutationHandlers[entityType].onCreateOrUpdate(m.changes.after as any);
        } else if (action === "DELETE") {
          await mutationHandlers[entityType].onDelete(m.entityId);
        }
        const { topic, ...log } = m;
        addAuditLog(log);
      }
    };
  }

  connect();
}
