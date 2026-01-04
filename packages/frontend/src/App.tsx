import { createEffect, createSignal } from "solid-js";

import Button from "./components/Button";
import { DragImageRenderer } from "./stores/DragController";
import { Panels, usePanelController } from "./stores/PanelController";
import ByDaySchedule from "./views/ByDaySchedule";
import WeekScheduleTable from "./views/WeekScheduleTable";

type TableType = "byDay" | "byWeek";

export default function App() {
  const { stack: panelStack } = usePanelController();
  const { openPanel } = usePanelController();
  const [tableType, setTableType] = createSignal<TableType>(
    localStorage.getItem("tableType") === "byWeek" ? "byWeek" : "byDay"
  );

  createEffect(() => {
    localStorage.setItem("tableType", tableType());
  });

  function RenderTable(type: TableType) {
    switch (type) {
      case "byDay":
        return <ByDaySchedule />;
      case "byWeek":
        return <WeekScheduleTable />;
    }
  }
  return (
    <>
      <div class="h-screen" onDragOver={(e) => e.preventDefault()}>
        <div
          class="w-full h-full flex"
          classList={{
            "md:pl-120": panelStack.length > 0,
          }}
        >
          <div class="h-full w-20 flex flex-col gap-2 p-2 bg-gray-50 shadow-sm">
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "TaskPool" })}
            >
              工作總覽
            </Button>
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "ProjectList" })}
            >
              專案
            </Button>
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "Person" })}
            >
              人員
            </Button>
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "Label" })}
            >
              標籤
            </Button>
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "ImportTasks" })}
            >
              匯入工作
            </Button>
            <hr class="my-1  border-gray-400" />
            <Button variant="secondary" onclick={() => setTableType("byDay")}>
              工作表
            </Button>
            <Button variant="secondary" onclick={() => setTableType("byWeek")}>
              計劃表
            </Button>
          </div>
          {RenderTable(tableType())}
        </div>
        <Panels />
      </div>
      <DragImageRenderer />
    </>
  );
}
