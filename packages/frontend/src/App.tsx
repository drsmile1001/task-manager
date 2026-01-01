import { Panels, usePanelController } from "./stores/PanelController";
import { useAssignmentStore } from "./stores/assignmentStore";
import { useDragStore } from "./stores/dragStore";
import ScheduleTable from "./views/ScheduleTable";

export default function App() {
  const { stack: panelStack } = usePanelController();

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
        <Panels />
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
