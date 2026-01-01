import { DragImageRenderer, useDragController } from "./stores/DragController";
import { Panels, usePanelController } from "./stores/PanelController";
import { useAssignmentStore } from "./stores/assignmentStore";
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
          const drag = useDragController().state();
          if (drag.type === "assignment") {
            useAssignmentStore().deleteAssignment(drag.assignmentId);
          }
          useDragController().clear();
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
