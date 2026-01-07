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
  const { setMilestone, deleteMilestone } = useMilestoneStore();
  const { setTask, deleteTask, loadTasks } = useTaskStore();
  const { setPlanning, deletePlanning, loadPlannings } = usePlanningStore();
  const { setAssignment, deleteAssignment, loadAssignments } =
    useAssignmentStore();
  const { addAuditLog } = useAuditLogStore();
  const mutationHandlers: Record<
    EntityType,
    {
      onCreateOrUpdate: (after: any) => void;
      onDelete: (id: string) => void;
    }
  > = {
    LABEL: {
      onCreateOrUpdate: setLabel,
      onDelete: deleteLabel,
    },
    PERSON: {
      onCreateOrUpdate: setPerson,
      onDelete: (id: string) => {
        loadAssignments();
        deletePerson(id);
      },
    },
    PROJECT: {
      onCreateOrUpdate: setProject,
      onDelete: (id: string) => {
        loadAssignments();
        loadTasks();
        deleteProject(id);
      },
    },
    MILESTONE: {
      onCreateOrUpdate: (after: Milestone) => {
        setMilestone(after);
        loadTasks();
      },
      onDelete: (id: string) => {
        loadTasks();
        deleteMilestone(id);
      },
    },
    TASK: {
      onCreateOrUpdate: setTask,
      onDelete: (id: string) => {
        loadPlannings();
        loadAssignments();
        deleteTask(id);
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

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.topic === "mutations") {
      const m = message as MutationTopic;
      const entityType = m.entityType;
      const action = m.action;
      if (action === "CREATE" || action === "UPDATE") {
        mutationHandlers[entityType].onCreateOrUpdate(m.changes.after as any);
      } else if (action === "DELETE") {
        mutationHandlers[entityType].onDelete(m.entityId);
      }
      const { topic, ...log } = m;
      addAuditLog(log);
    }
  };
}
