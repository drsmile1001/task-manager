import { Show, createSignal } from "solid-js";

import FilterPanel from "./components/FilterPanel";
import ImportTasksPanel from "./components/ImportTasksPanel";
import LabelPanel from "./components/LabelPanel";
import PersonPanel from "./components/PersonPanel";
import ProjectPanel from "./components/ProjectPanel";
import ScheduleTable from "./components/ScheduleTable";
import TaskDetailsPanel from "./components/TaskDetailsPanel";
import TaskPool from "./components/TaskPool";
import { useAssignmentStore } from "./stores/assignmentStore";
import { useDragStore } from "./stores/dragStore";

export default function App() {
  const [taskPanelTaskId, setTaskPanelTaskId] = createSignal<string | null>(
    null
  );
  const [taskPanelIsOpen, setTaskPanelIsOpen] = createSignal(false);
  const [filterPanelIsOpen, setFilterPanelIsOpen] = createSignal(false);
  const [labelPanelIsOpen, setLabelPanelIsOpen] = createSignal(false);
  const [personPanelIsOpen, setPersonPanelIsOpen] = createSignal(false);
  const [projectPanelIsOpen, setProjectPanelIsOpen] = createSignal(false);
  const [importTasksPanelIsOpen, setImportTasksPanelIsOpen] =
    createSignal(false);

  function closePanels() {
    setTaskPanelIsOpen(false);
    setFilterPanelIsOpen(false);
    setLabelPanelIsOpen(false);
    setPersonPanelIsOpen(false);
    setProjectPanelIsOpen(false);
    setImportTasksPanelIsOpen(false);
  }

  const openEditTask = (taskId: string) => {
    closePanels();

    setTaskPanelTaskId(taskId);
    setTaskPanelIsOpen(true);
  };

  const handleClickAssignment = (assignmentId: string) => {
    const assignment = useAssignmentStore().getAssignment(assignmentId);
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
  const handleShowPersonPanel = () => {
    closePanels();
    setPersonPanelIsOpen(true);
  };
  const handleShowProjectPanel = () => {
    closePanels();
    setProjectPanelIsOpen(true);
  };
  const handleShowImportTasksPanel = () => {
    closePanels();
    setImportTasksPanelIsOpen(true);
  };

  return (
    <div
      class="h-screen flex"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const drag = useDragStore().state();
        if (drag.type === "assignment") {
          useAssignmentStore().deleteAssignment(drag.assignmentId);
        }
        useDragStore().clear();
      }}
    >
      <TaskPool onEditTask={openEditTask} />
      <ScheduleTable
        onClickAssignment={handleClickAssignment}
        onClickShowFilter={handleShowFilterPanel}
        onClickShowPerson={handleShowPersonPanel}
        onClickShowLabel={handleShowLabelPanel}
        onClickShowProject={handleShowProjectPanel}
        onClickShowImportTasks={handleShowImportTasksPanel}
      />

      <Show when={taskPanelIsOpen() && !!taskPanelTaskId()}>
        <TaskDetailsPanel taskId={taskPanelTaskId()!} onClose={closePanels} />
      </Show>
      <Show when={filterPanelIsOpen()}>
        <FilterPanel onClose={closePanels} />
      </Show>
      <Show when={labelPanelIsOpen()}>
        <LabelPanel onClose={closePanels} />
      </Show>
      <Show when={personPanelIsOpen()}>
        <PersonPanel onClose={closePanels} />
      </Show>
      <Show when={projectPanelIsOpen()}>
        <ProjectPanel onClose={closePanels} />
      </Show>
      <Show when={importTasksPanelIsOpen()}>
        <ImportTasksPanel onClose={closePanels} />
      </Show>
    </div>
  );
}
