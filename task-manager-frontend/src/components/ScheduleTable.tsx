import { For } from "solid-js";
import type { Assignment, Person } from "../data";

export default function ScheduleTable(props: {
  persons: Person[];
  assignments: Assignment[];
  week: { key: string; label: string }[];
  tasksMap: Record<string, string>;
}) {
  const { persons, week, assignments, tasksMap } = props;

  return (
    <div class="flex-1 overflow-auto p-4">
      <div class="text-gray-700 font-bold mb-3">本週工作表</div>

      <div
        class="inline-grid border border-gray-300"
        style={{
          "grid-template-columns": `120px repeat(${week.length}, 1fr)`,
        }}
      >
        {/* Header */}
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

        {/* Rows */}
        <For each={persons}>
          {(p) => (
            <>
              {/* Person name */}
              <div class="border-b border-r p-2 font-medium bg-white sticky left-0 z-[1] bg-white">
                {p.name}
              </div>

              {/* Dates */}
              <For each={week}>
                {(d) => {
                  const items = assignments.filter(
                    (a) => a.personId === p.id && a.date === d.key
                  );
                  return (
                    <div class="border-b border-r p-1 min-h-[60px] bg-white">
                      <For each={items}>
                        {(a) => (
                          <div class="bg-blue-100 border border-blue-300 text-xs p-1 rounded mb-1">
                            {tasksMap[a.taskId]}
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
