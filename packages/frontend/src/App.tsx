import { createEffect, createSignal } from "solid-js";

import { client } from "./client";
import Button from "./components/Button";
import { DragImageRenderer } from "./stores/DragController";
import { Panels, usePanelController } from "./stores/PanelController";
import { useSharedFilterStore } from "./stores/SharedFilterStore";
import { useAssignmentStore } from "./stores/assignmentStore";
import { useLabelStore } from "./stores/labelStore";
import { useMilestoneStore } from "./stores/milestoneStore";
import { usePersonStore } from "./stores/personStore";
import { usePlanningStore } from "./stores/planningStore";
import { useProjectStore } from "./stores/projectStore";
import { useTaskStore } from "./stores/taskStore";
import { sync } from "./sync";
import ByDaySchedule from "./views/ByDaySchedule";
import WeekScheduleTable from "./views/WeekScheduleTable";

type TableType = "byDay" | "byWeek";

export default function App() {
  usePanelController();
  useSharedFilterStore();
  useLabelStore();
  usePersonStore();
  useProjectStore();
  useMilestoneStore();
  useTaskStore();
  usePlanningStore();
  useAssignmentStore();
  sync();
  const { stack: panelStack } = usePanelController();
  const { openPanel } = usePanelController();
  const [tableType, setTableType] = createSignal<TableType>(
    localStorage.getItem("tableType") === "byWeek" ? "byWeek" : "byDay"
  );
  const [user, setUser] = createSignal<string | null>(null);

  client.api.me.get().then(({ data }) => {
    if (data) {
      setUser(data.name);
    }
  });

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

  async function logout() {
    await client.api.logout.post();
    window.location.reload();
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
          <div class="h-full w-20 flex flex-col items-center gap-2 p-2 bg-gray-50 shadow-sm">
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "TASK_POOL" })}
            >
              工作總覽
            </Button>
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "PROJECT_LIST" })}
            >
              專案
            </Button>
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "PERSON_LIST" })}
            >
              人員
            </Button>
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "LABEL" })}
            >
              標籤
            </Button>
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "IMPORT_TASKS" })}
            >
              匯入工作
            </Button>
            <Button
              variant="secondary"
              onclick={() => openPanel({ type: "AUDIT_LOG" })}
            >
              操作記錄
            </Button>
            <hr class="my-1 w-10 border-gray-400" />
            <Button variant="secondary" onclick={() => setTableType("byDay")}>
              工作表
            </Button>
            <Button variant="secondary" onclick={() => setTableType("byWeek")}>
              計劃表
            </Button>
            <div class="flex-1"></div>
            <span>{user()}</span>
            <Button variant="secondary" onclick={() => logout()}>
              登出
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
