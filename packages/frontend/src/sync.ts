import type { MutationTopic } from "@backend/api";

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

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.topic === "mutations") {
      const m = message as MutationTopic;
      switch (m.type) {
        case "LABEL":
          switch (m.action) {
            case "CREATE":
            case "UPDATE":
              useLabelStore().setLabel(m.entity as any);
              break;
            case "DELETE":
              useLabelStore().deleteLabel(m.id);
              break;
            default:
              break;
          }
          break;
        case "PERSON":
          switch (m.action) {
            case "CREATE":
            case "UPDATE":
              usePersonStore().setPerson(m.entity as any);
              break;
            case "DELETE":
              useAssignmentStore().loadAssignments();
              usePersonStore().deletePerson(m.id);
              break;
            default:
              break;
          }
          break;
        case "PROJECT":
          switch (m.action) {
            case "CREATE":
            case "UPDATE":
              useProjectStore().setProject(m.entity as any);
              break;
            case "DELETE":
              useAssignmentStore().loadAssignments();
              useTaskStore().loadTasks();
              useProjectStore().deleteProject(m.id);
              break;
            default:
              break;
          }
          break;
        case "MILESTONE":
          switch (m.action) {
            case "CREATE":
            case "UPDATE":
              useMilestoneStore().setMilestone(m.entity as any);
              useTaskStore().loadTasks();
              break;
            case "DELETE":
              useTaskStore().loadTasks();
              useMilestoneStore().deleteMilestone(m.id);
              break;
            default:
              break;
          }
          break;
        case "TASK":
          switch (m.action) {
            case "CREATE":
            case "UPDATE":
              useTaskStore().setTask(m.entity as any);
              break;
            case "DELETE":
              useAssignmentStore().loadAssignments();
              useTaskStore().deleteTask(m.id);
              break;
            default:
              break;
          }
          break;
        case "PLANNING":
          switch (m.action) {
            case "CREATE":
            case "UPDATE":
              usePlanningStore().setPlanning(m.entity as any);
              break;
            case "DELETE":
              usePlanningStore().deletePlanning(m.id);
              break;
            default:
              break;
          }
          break;
        case "ASSIGNMENT":
          switch (m.action) {
            case "CREATE":
            case "UPDATE":
              useAssignmentStore().setAssignment(m.entity as any);
              break;
            case "DELETE":
              useAssignmentStore().deleteAssignment(m.id);
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
      useAuditLogStore().loadAuditLogs();
    }
  };
}
