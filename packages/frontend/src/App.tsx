import { Show, createSignal } from "solid-js";

import type { MutationTopic } from "@backend/api";

import ProjectDetailsPanel from "./components/ProjectDetailsPanel";
import ScheduleTable from "./components/ScheduleTable";
import TaskDetailsPanel from "./components/TaskDetailsPanel";
import TaskPool from "./components/TaskPool";
import { createAssignmentStore } from "./stores/assignmentStore";
import { createDragStore } from "./stores/dragStore";
import { createFilterStore } from "./stores/filterStore";
import { createPersonStore } from "./stores/personStore";
import { createProjectStore } from "./stores/projectStore";
import { createTaskStore } from "./stores/taskStore";

export default function App() {
  const taskStore = createTaskStore();
  const projectStore = createProjectStore();
  const assignmentStore = createAssignmentStore();
  const dragStore = createDragStore();
  const personStore = createPersonStore();
  const filterStore = createFilterStore();

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

  const [projectPanelProjectId, setProjectPanelProjectId] = createSignal<
    string | null
  >(null);
  const [projectPanelIsOpen, setProjectPanelIsOpen] = createSignal(false);

  const [taskPanelTaskId, setTaskPanelTaskId] = createSignal<string | null>(
    null
  );
  const [taskPanelIsOpen, setTaskPanelIsOpen] = createSignal(false);
  const [projectIdForCreate, setProjectIdForCreate] = createSignal<
    string | null
  >(null);

  function closePanels() {
    setProjectPanelIsOpen(false);
    setTaskPanelIsOpen(false);
  }

  const openCreateTask = (projectId: string) => {
    closePanels();

    setProjectIdForCreate(projectId);
    setTaskPanelTaskId(null);
    setTaskPanelIsOpen(true);
  };

  const openEditTask = (taskId: string) => {
    closePanels();

    setTaskPanelTaskId(taskId);
    setTaskPanelIsOpen(true);
  };

  const openCreateProject = () => {
    closePanels();

    setProjectPanelProjectId(null);
    setProjectPanelIsOpen(true);
  };

  const openEditProject = (projectId: string) => {
    closePanels();

    setProjectPanelProjectId(projectId);
    setProjectPanelIsOpen(true);
  };

  return (
    <div
      class="flex h-screen"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const drag = dragStore.state();
        if (drag.type === "assignment") {
          assignmentStore.deleteAssignment(drag.assignmentId);
        }
        dragStore.clear();
      }}
    >
      <TaskPool
        assignmentStore={assignmentStore}
        taskStore={taskStore}
        projectStore={projectStore}
        dragStore={dragStore}
        onCreateTask={openCreateTask}
        onEditTask={openEditTask}
        onCreateProject={openCreateProject}
        onEditProject={openEditProject}
      />

      <div class="flex-1 overflow-hidden">
        <ScheduleTable
          personStore={personStore}
          filterStore={filterStore}
          assignmentStore={assignmentStore}
          projectStore={projectStore}
          taskStore={taskStore}
          dragStore={dragStore}
        />
      </div>

      <Show when={taskPanelIsOpen()}>
        <TaskDetailsPanel
          taskId={taskPanelTaskId()}
          projectIdForCreate={projectIdForCreate()}
          taskStore={taskStore}
          projectStore={projectStore}
          onClose={closePanels}
        />
      </Show>

      <Show when={projectPanelIsOpen()}>
        <ProjectDetailsPanel
          projectId={projectPanelProjectId()}
          projectStore={projectStore}
          onClose={closePanels}
        />
      </Show>
    </div>
  );
}
