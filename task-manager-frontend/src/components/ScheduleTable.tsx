import { For, createMemo } from "solid-js";
import type { Person } from "../data";
import type { AssignmentStore } from "../stores/assignmentStore";
import type { TaskStore } from "../stores/taskStore";

export type Props = {
  persons: Person[];
  week: { key: string; label: string }[];
  assignmentStore: AssignmentStore;
  taskStore: TaskStore;
};

export default function ScheduleTable(props: Props) {
  const { persons, week, assignmentStore, taskStore } = props;

  const tasksMap = createMemo(() => {
    return Object.fromEntries(taskStore.tasks().map((t) => [t.id, t.name]));
  });

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
              <div class="border-b border-r p-2 font-medium sticky left-0 z-[1] bg-white">
                {p.name}
              </div>

              {/* Each day */}
              <For each={week}>
                {(d) => {
                  const items = createMemo(() =>
                    assignmentStore.listForPersonOnDate(p.id, d.key)
                  );

                  return (
                    <div
                      class="border-b border-r p-1 min-h-[60px] bg-white"
                      onDragOver={(e) => e.preventDefault()}
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
                            {tasksMap()[a.taskId] ?? "(未知工作)"}
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
