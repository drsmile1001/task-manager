import { For } from "solid-js";
import type { Person } from "../data";
import type { AssignmentStore } from "../stores/assignmentStore";
import { createMemo } from "solid-js";

export type Props = {
  persons: Person[];
  week: { key: string; label: string }[];
  assignmentStore: AssignmentStore;
  tasksMap: Record<string, string>;
};

export default function ScheduleTable(props: Props) {
  const { persons, week, assignmentStore, tasksMap } = props;

  return (
    <div class="flex-1 overflow-auto p-4">
      <div class="text-gray-700 font-bold mb-3">本週工作表</div>

      <div
        class="inline-grid border border-gray-300"
        style={{
          "grid-template-columns": `120px repeat(${week.length}, 1fr)`,
        }}
      >
        {/* Header: 日期列表 */}
        <div class="border-b border-r p-2 bg-gray-100 font-semibold text-sm">
          人員
        </div>

        <For each={week}>
          {(d) => (
            <div class="border-b border-r p-2 bg-gray-100 text-sm text-center">
              {d.label}
            </div>
          )}
        </For>

        {/* rows: 每個人 */}
        <For each={persons}>
          {(p) => (
            <>
              {/* 左欄：人名 */}
              <div class="border-b border-r p-2 font-medium sticky left-0 z-[1] bg-white">
                {p.name}
              </div>

              {/* 每天列表 */}
              <For each={week}>
                {(d) => {
                  const items = createMemo(() =>
                    assignmentStore.listForPersonOnDate(p.id, d.key)
                  );

                  return (
                    <div
                      class="border-b border-r p-1 min-h-[60px] bg-white"
                      onDragOver={(e) => {
                        // 必須阻止預設行為，否則 drop 事件不會觸發
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const taskId = e.dataTransfer!.getData("text/plain");
                        if (!taskId) return;

                        assignmentStore.createAssignment({
                          taskId,
                          personId: p.id,
                          date: d.key,
                        });
                      }}
                    >
                      <For each={items()}>
                        {(a) => (
                          <div class="bg-blue-100 border border-blue-300 text-xs p-1 rounded mb-1">
                            {tasksMap[a.taskId] ?? "(未知工作)"}
                          </div>
                        )}
                      </For>
                    </div>
                  );
                }}
              </For>
            </>
          )}
        </For>
      </div>
    </div>
  );
}
