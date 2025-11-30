import { For, createMemo } from "solid-js";
import type { Person } from "../data";
import type { AssignmentStore } from "../stores/assignmentStore";
import type { TaskStore } from "../stores/taskStore";
import type { DragStore } from "../stores/dragStore";

export type Props = {
  persons: Person[];
  week: { key: string; label: string }[];
  assignmentStore: AssignmentStore;
  taskStore: TaskStore;
  dragStore: DragStore;
};

export default function ScheduleTable(props: Props) {
  const { persons, week, assignmentStore, taskStore, dragStore } = props;

  const tasksMap = createMemo(() =>
    Object.fromEntries(taskStore.tasks().map((t) => [t.id, t.name]))
  );

  return (
    <div class="flex-1 overflow-auto p-4">
      <div class="text-gray-700 font-bold mb-3">本週工作表</div>

      <div
        class="inline-grid border border-gray-300"
        style={{
          "grid-template-columns": `120px repeat(${week.length}, 1fr)`,
        }}
      >
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

        <For each={persons}>
          {(p) => (
            <>
              <div class="border-b border-r p-2 font-medium sticky left-0 z-[1] bg-white">
                {p.name}
              </div>

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
                        const drag = dragStore.state();

                        // 建立新指派
                        if (drag.type === "task") {
                          assignmentStore.createAssignment({
                            taskId: drag.taskId,
                            personId: p.id,
                            date: d.key,
                          });
                        }
                        // 移動既有指派
                        else if (drag.type === "assignment") {
                          assignmentStore.updateAssignment(drag.assignmentId, {
                            personId: p.id,
                            date: d.key,
                          });
                        }

                        dragStore.clear();
                      }}
                    >
                      <For each={items()}>
                        {(a) => (
                          <div
                            class="bg-blue-100 border border-blue-300 text-xs p-1 rounded mb-1 cursor-pointer"
                            draggable="true"
                            ondragstart={() => {
                              props.dragStore.startAssignmentDrag({
                                assignmentId: a.id,
                                personId: a.personId,
                                date: a.date,
                              });
                            }}
                          >
                            {tasksMap()[a.taskId]}
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
