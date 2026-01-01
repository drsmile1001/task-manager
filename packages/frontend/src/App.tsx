import FilterPanel from "./components/FilterPanel";
import ImportTasksPanel from "./components/ImportTasksPanel";
import LabelPanel from "./components/LabelPanel";
import MilestoneDetailsPanel from "./components/MilestoneDetailsPanel";
import PersonPanel from "./components/PersonPanel";
import ProjectDetailsPanel from "./components/ProjectDetailsPanel";
import ProjectListPanel from "./components/ProjectListPanel";
import ScheduleTable from "./components/ScheduleTable";
import TaskDetailsPanel from "./components/TaskDetailsPanel";
import TaskPool from "./components/TaskPool";
import { useAssignmentStore } from "./stores/assignmentStore";
import {
  type PanelContext,
  usePanelController,
} from "./stores/detailPanelController";
import { useDragStore } from "./stores/dragStore";

export default function App() {
  const { currentContext } = usePanelController();

  function matchPanelComponent(context: PanelContext | null) {
    if (!context) return <div></div>;
    switch (context.type) {
      case "Filter":
        return <FilterPanel />;
      case "Label":
        return <LabelPanel />;
      case "Person":
        return <PersonPanel />;
      case "ProjectList":
        return <ProjectListPanel />;
      case "ProjectDetails":
        return <ProjectDetailsPanel projectId={context.projectId} />;
      case "ImportTasks":
        return <ImportTasksPanel />;
      case "Milestone":
        return <MilestoneDetailsPanel milestoneId={context.milestoneId} />;
      case "Task":
        return <TaskDetailsPanel taskId={context.taskId} />;
      default:
        return <div></div>;
    }
  }

  return (
    <>
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
        <TaskPool />
        <ScheduleTable />
        {matchPanelComponent(currentContext())}
      </div>
      <DragImageRenderer />
    </>
  );
}

function DragImageRenderer() {
  let containerRef: HTMLDivElement | undefined;
  const { renderFn, notifyRenderReady } = useDragStore();

  function render() {
    const state = renderFn();
    if (!state) return null;
    queueMicrotask(() => {
      if (containerRef?.firstElementChild) {
        notifyRenderReady(containerRef.firstElementChild as HTMLElement);
      }
    });
    return state.render();
  }

  return (
    <div
      class="absolute top-[-100vh] left-[-100vw] pointer-events-none"
      ref={containerRef}
    >
      {render()}
    </div>
  );
}
