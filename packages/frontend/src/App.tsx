import { client } from "./client";
import Button from "./components/Button";
import { DragImageRenderer } from "./stores/DragController";
import { Panels, usePanelController } from "./stores/PanelController";
import { useSharedFilterStore } from "./stores/SharedFilterStore";
import { useAssignmentStore } from "./stores/assignmentStore";
import { useCurrentUserStore } from "./stores/currentUserStore";
import { useLabelStore } from "./stores/labelStore";
import { useMilestoneStore } from "./stores/milestoneStore";
import { usePersonStore } from "./stores/personStore";
import { usePlanningStore } from "./stores/planningStore";
import { type TableType, usePreferenceStore } from "./stores/preferenceStore";
import { useProjectStore } from "./stores/projectStore";
import { useTaskStore } from "./stores/taskStore";
import { sync } from "./sync";
import ByDaySchedule from "./views/ByDaySchedule";
import WeekScheduleTable from "./views/WeekScheduleTable";

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
  const { preference, setPreference } = usePreferenceStore();
  const { currentUser, setCurrentUser } = useCurrentUserStore();
  sync();
  const { stack: panelStack } = usePanelController();
  const { openPanel } = usePanelController();

  client.api.me.get().then(({ data }) => {
    if (data) {
      setCurrentUser(data);
    }
  });

  function RenderTable(type: TableType) {
    switch (type) {
      case "BY_DAY":
        return <ByDaySchedule />;
      case "BY_WEEK":
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
            <Button
              variant="secondary"
              onclick={() => setPreference("tableType", "BY_DAY")}
            >
              工作表
            </Button>
            <Button
              variant="secondary"
              onclick={() => setPreference("tableType", "BY_WEEK")}
            >
              計劃表
            </Button>
            <div class="flex-1"></div>
            <span>{currentUser.name}</span>
            <Button variant="secondary" onclick={() => logout()}>
              登出
            </Button>
          </div>
          {RenderTable(preference.tableType)}
        </div>
        <Panels />
      </div>
      <DragImageRenderer />
    </>
  );
}
