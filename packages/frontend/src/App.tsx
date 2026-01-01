import { DragImageRenderer } from "./stores/DragController";
import { Panels, usePanelController } from "./stores/PanelController";
import ScheduleTable from "./views/ScheduleTable";

export default function App() {
  const { stack: panelStack } = usePanelController();

  return (
    <>
      <div class="h-screen flex" onDragOver={(e) => e.preventDefault()}>
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
