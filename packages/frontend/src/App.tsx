import { Show, createSignal } from "solid-js";

import FilterPanel from "./components/FilterPanel";
import LabelPanel from "./components/LabelPanel";
import ProjectDetailsPanel from "./components/ProjectDetailsPanel";
import ScheduleTable from "./components/ScheduleTable";
import TaskDetailsPanel from "./components/TaskDetailsPanel";
import TaskPool from "./components/TaskPool";
import { assignmentStore } from "./stores/assignmentStore";
import { dragStore } from "./stores/dragStore";

export default function App() {
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

  const [filterPanelIsOpen, setFilterPanelIsOpen] = createSignal(false);
  const [labelPanelIsOpen, setLabelPanelIsOpen] = createSignal(false);

  function closePanels() {
    setProjectPanelIsOpen(false);
    setTaskPanelIsOpen(false);
    setFilterPanelIsOpen(false);
    setLabelPanelIsOpen(false);
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

  const handleClickAssignment = (assignmentId: string) => {
    const assignment = assignmentStore.getAssignment(assignmentId);
    if (!assignment) return;
    closePanels();
    openEditTask(assignment.taskId);
  };

  const handleShowFilterPanel = () => {
    closePanels();
    setFilterPanelIsOpen(true);
  };
  const handleShowLabelPanel = () => {
    closePanels();
    setLabelPanelIsOpen(true);
  };

  return (
    <div
      class="h-screen flex"
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
        onCreateTask={openCreateTask}
        onEditTask={openEditTask}
        onCreateProject={openCreateProject}
        onEditProject={openEditProject}
      />
      <ScheduleTable
        onClickAssignment={handleClickAssignment}
        onClickShowFilter={handleShowFilterPanel}
      />

      <Show when={taskPanelIsOpen()}>
        <TaskDetailsPanel
          taskId={taskPanelTaskId()}
          projectIdForCreate={projectIdForCreate()}
          onClickEditLabels={handleShowLabelPanel}
          onClose={closePanels}
        />
      </Show>
      <Show when={projectPanelIsOpen()}>
        <ProjectDetailsPanel
          projectId={projectPanelProjectId()}
          onClose={closePanels}
        />
      </Show>
      <Show when={filterPanelIsOpen()}>
        <FilterPanel onClose={closePanels} />
      </Show>
      <Show when={labelPanelIsOpen()}>
        <LabelPanel onClose={closePanels} />
      </Show>
    </div>
  );
}
