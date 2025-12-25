import type { MutationTopic } from "@backend/api";

import { assignmentStore } from "./stores/assignmentStore";
import { projectStore } from "./stores/projectStore";
import { taskStore } from "./stores/taskStore";

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
        case "task":
          switch (m.action) {
            case "create":
              taskStore.createTask(m.eneity as any);
              break;
            case "update":
              taskStore.updateTask(m.eneity as any);
              break;
            case "delete":
              taskStore.deleteTask(m.id);
              assignmentStore.loadAssignments();
              break;
            default:
              break;
          }
          break;
        case "project":
          switch (m.action) {
            case "create":
              projectStore.createProject(m.eneity as any);
              break;
            case "update":
              projectStore.updateProject(m.eneity as any);
              break;
            case "delete":
              projectStore.deleteProject(m.id);
              taskStore.loadTasks();
              assignmentStore.loadAssignments();
              break;
            default:
              break;
          }
          break;
        case "assignment":
          switch (m.action) {
            case "create":
              assignmentStore.createAssignment(m.eneity as any);
              break;
            case "update":
              assignmentStore.updateAssignment(m.eneity as any);
              break;
            case "delete":
              assignmentStore.deleteAssignment(m.id);
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
