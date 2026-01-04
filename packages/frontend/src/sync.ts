import type { MutationTopic } from "@backend/api";

import { useAssignmentStore } from "./stores/assignmentStore";
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
        case "label":
          switch (m.action) {
            case "create":
            case "update":
              useLabelStore().setLabel(m.eneity as any);
              break;
            case "delete":
              useLabelStore().deleteLabel(m.id);
              break;
            default:
              break;
          }
          break;
        case "person":
          switch (m.action) {
            case "create":
            case "update":
              usePersonStore().setPerson(m.eneity as any);
              break;
            case "delete":
              useAssignmentStore().loadAssignments();
              usePersonStore().deletePerson(m.id);
              break;
            default:
              break;
          }
          break;
        case "project":
          switch (m.action) {
            case "create":
            case "update":
              useProjectStore().setProject(m.eneity as any);
              break;
            case "delete":
              useAssignmentStore().loadAssignments();
              useTaskStore().loadTasks();
              useProjectStore().deleteProject(m.id);
              break;
            default:
              break;
          }
          break;
        case "milestone":
          switch (m.action) {
            case "create":
            case "update":
              useMilestoneStore().setMilestone(m.eneity as any);
              useTaskStore().loadTasks();
              break;
            case "delete":
              useTaskStore().loadTasks();
              useMilestoneStore().deleteMilestone(m.id);
              break;
            default:
              break;
          }
          break;
        case "task":
          switch (m.action) {
            case "create":
            case "update":
              useTaskStore().setTask(m.eneity as any);
              break;
            case "delete":
              useAssignmentStore().loadAssignments();
              useTaskStore().deleteTask(m.id);
              break;
            default:
              break;
          }
          break;
        case "planning":
          switch (m.action) {
            case "create":
            case "update":
              usePlanningStore().setPlanning(m.eneity as any);
              break;
            case "delete":
              usePlanningStore().deletePlanning(m.id);
              break;
            default:
              break;
          }
          break;
        case "assignment":
          switch (m.action) {
            case "create":
            case "update":
              useAssignmentStore().setAssignment(m.eneity as any);
              break;
            case "delete":
              useAssignmentStore().deleteAssignment(m.id);
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
    }
  };
}
