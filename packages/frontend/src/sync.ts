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
import { useTaskStore } from "./stores/taskStore";

export function sync() {
  const wshost =
    window.location.hostname === "localhost"
      ? "ws://localhost:3000/ws"
      : `wss://${window.location.host + import.meta.env.BASE_URL}ws`;

  const ws = new WebSocket(wshost);
  ws.onopen = () => {
    setInterval(() => {
      ws.send(
        JSON.stringify({
          topic: "ping",
          timeStamp: new Date().toISOString(),
        })
      );
    }, 10000);
  };
  const { setLabel, deleteLabel } = useLabelStore();
  const { setPerson, deletePerson } = usePersonStore();
  const { setProject, deleteProject } = useProjectStore();
  const { setMilestone, deleteMilestone, deleteMilestonesByProjectId } =
    useMilestoneStore();
  const {
    setTask,
    deleteTask,
    deleteTasksByProjectId,
    applyMilestoneDueDateToTasks,
    clearMilestoneFromTasks,
  } = useTaskStore();
  const {
    setPlanning,
    deletePlanning,
    deletePlanningsByTaskId,
    deletePlanningsByTaskIds,
  } = usePlanningStore();
  const {
    setAssignment,
    deleteAssignment,
    deleteAssignmentsByTaskId,
    deleteAssignmentsByTaskIds,
    deleteAssignmentsByPersonId,
  } = useAssignmentStore();
  const { addAuditLog } = useAuditLogStore();
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

  ws.onmessage = async (event) => {
    const message = JSON.parse(event.data);
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
