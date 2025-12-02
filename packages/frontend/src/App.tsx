import { Show, createSignal } from "solid-js";

import ProjectDetailsPanel from "./components/ProjectDetailsPanel";
import ScheduleTable from "./components/ScheduleTable";
import TaskDetailsPanel from "./components/TaskDetailsPanel";
import TaskPool from "./components/TaskPool";
import { createAssignmentStore } from "./stores/assignmentStore";
import { createDragStore } from "./stores/dragStore";
import { createPersonStore } from "./stores/personStore";
import { createProjectStore } from "./stores/projectStore";
import { createTaskStore } from "./stores/taskStore";
import { genWeek } from "./utils/date";

export default function App() {
  // --- stores ---
  const taskStore = createTaskStore();
  const projectStore = createProjectStore();
  const assignmentStore = createAssignmentStore();
  const dragStore = createDragStore();
  const personStore = createPersonStore();
  const week = genWeek();

  // --- Task Panel State ---
  const [taskPanelTaskId, setTaskPanelTaskId] = createSignal<string | null>(
    null
  );
  const [taskPanelProjectIdForCreate, setTaskPanelProjectIdForCreate] =
    createSignal<string | null>(null);

  // --- Project Panel State ---
  const [projectPanelProjectId, setProjectPanelProjectId] = createSignal<
    string | null
  >(null);
  const [isProjectCreating, setIsProjectCreating] = createSignal(false);

  // --- Derived values ---
  const selectedProject = () => {
    const id = projectPanelProjectId();
    return id ? projectStore.getProject(id)! : null;
  };

  // --- Handlers ---

  // 開啟「新增 Task」
  const openCreateTask = (projectId: string) => {
    setTaskPanelTaskId(null);
    setTaskPanelProjectIdForCreate(projectId);

    // 關閉 Project panel
    setProjectPanelProjectId(null);
    setIsProjectCreating(false);
  };

  // 開啟「編輯 Task」
  const openEditTask = (taskId: string) => {
    setTaskPanelTaskId(taskId);
    setTaskPanelProjectIdForCreate(null);

    // 關閉 Project panel
    setProjectPanelProjectId(null);
    setIsProjectCreating(false);
  };

  // 開啟「新增 Project」
  const openCreateProject = () => {
    setIsProjectCreating(true);
    setProjectPanelProjectId(null);

    // 關閉 Task panel
    setTaskPanelTaskId(null);
    setTaskPanelProjectIdForCreate(null);
  };

  // 開啟「編輯 Project」
  const openEditProject = (projectId: string) => {
    setIsProjectCreating(false);
    setProjectPanelProjectId(projectId);

    // 關閉 Task panel
    setTaskPanelTaskId(null);
    setTaskPanelProjectIdForCreate(null);
  };

  // 關閉所有 panel
  const closePanel = () => {
    setTaskPanelTaskId(null);
    setTaskPanelProjectIdForCreate(null);
    setProjectPanelProjectId(null);
    setIsProjectCreating(false);
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
      {/* 左側 Project & Task 清單 */}
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

      {/* 中間 schedule */}
      <div class="flex-1 overflow-hidden">
        <ScheduleTable
          personStore={personStore}
          week={week}
          assignmentStore={assignmentStore}
          projectStore={projectStore}
          taskStore={taskStore}
          dragStore={dragStore}
        />
      </div>

      {/* --- Task Details Panel --- */}
      <Show when={taskPanelTaskId() || taskPanelProjectIdForCreate()}>
        <TaskDetailsPanel
          taskId={taskPanelTaskId()}
          projectIdForCreate={taskPanelProjectIdForCreate()}
          taskStore={taskStore}
          projectStore={projectStore}
          onClose={closePanel}
        />
      </Show>

      {/* --- Project Details Panel --- */}
      <Show when={isProjectCreating() || selectedProject()}>
        <ProjectDetailsPanel
          project={selectedProject()}
          isCreating={isProjectCreating()}
          projectStore={projectStore}
          onClose={closePanel}
        />
      </Show>
    </div>
  );
}
