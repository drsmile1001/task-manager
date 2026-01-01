import { For } from "solid-js";

import { useAssignmentStore } from "./stores/assignmentStore";
import {
  type PanelOptions,
  usePanelController,
} from "./stores/detailPanelController";
import { useDragStore } from "./stores/dragStore";
import FilterPanel from "./views/FilterPanel";
import ImportTasksPanel from "./views/ImportTasksPanel";
import LabelPanel from "./views/LabelPanel";
import MilestoneDetailsPanel from "./views/MilestoneDetailsPanel";
import PersonPanel from "./views/PersonPanel";
import ProjectDetailsPanel from "./views/ProjectDetailsPanel";
import ProjectListPanel from "./views/ProjectListPanel";
import ScheduleTable from "./views/ScheduleTable";
import TaskDetailsPanel from "./views/TaskDetailsPanel";
import TaskPool from "./views/TaskPool";

export default function App() {
  const { stack: panelStack } = usePanelController();

  function matchPanelComponent(context: PanelOptions) {
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
      case "TaskPool":
        return <TaskPool />;
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
        <div
          classList={{
            "md:ml-120": panelStack.length > 0,
          }}
        >
          <ScheduleTable />
        </div>
        <For each={panelStack}>
          {(context) => (
            <div
              class="absolute top-0 h-full"
              style={{
                "z-index": context.deep + 100,
              }}
            >
              {matchPanelComponent(context)}
            </div>
          )}
        </For>
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
