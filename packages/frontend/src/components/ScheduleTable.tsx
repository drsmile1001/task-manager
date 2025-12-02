import { For, createMemo } from "solid-js";

import type { Person } from "../data";
import type { AssignmentStore } from "../stores/assignmentStore";
import type { DragStore } from "../stores/dragStore";
import type { ProjectStore } from "../stores/projectStore";
import type { TaskStore } from "../stores/taskStore";

export type Props = {
  persons: Person[];
  week: { key: string; label: string }[];
  assignmentStore: AssignmentStore;
  taskStore: TaskStore;
  projectStore: ProjectStore;
  dragStore: DragStore;
};

export default function ScheduleTable(props: Props) {
  const { persons, week, assignmentStore, taskStore, dragStore } = props;

  // project + task 名稱組合
  const tasksMap = createMemo(() => {
    const projects = props.projectStore.projects();
    return Object.fromEntries(
      taskStore.tasks().map((t) => {
        const project = projects.find((p) => p.id === t.projectId);
        const name = `[${project?.name ?? "?"}] ${t.name}`;
        return [t.id, name];
      })
    );
  });

  // debug: 全部 assign 列表（確認 reactive）
  console.log("assignments:", assignmentStore.assignments());

  return (
    <div
      class="flex-1 overflow-auto p-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        // 拖拽到空白區域則刪除指派
        e.preventDefault();
        const drag = dragStore.state();

        if (drag.type === "assignment") {
          assignmentStore.deleteAssignment(drag.assignmentId);
        }
        dragStore.clear();
      }}
    >
      <div class="text-gray-700 font-bold mb-3">本週工作表</div>

      <div
        class="inline-grid border border-gray-300"
        style={{
          "grid-template-columns": `120px repeat(${week.length}, 1fr)`,
        }}
      >
        {/* 表頭：日期 */}
        <div class="border-b border-r p-2 bg-gray-100 font-semibold text-sm">
          人員
        </div>

        <For each={week}>
          {(d) => (
            <div class="border-b border-r p-2 bg-gray-100 text-sm text-center w-30">
              {d.label}
            </div>
          )}
        </For>

        {/* Row：每個人 */}
        <For each={persons}>
          {(p) => (
            <>
              {/* 左欄：人名 */}
              <div class="border-b border-r p-2 font-medium sticky left-0 z-[1] bg-white">
                {p.name}
              </div>

              {/* 每天 */}
              <For each={week}>
                {(d) => {
                  const items = () =>
                    assignmentStore.listForPersonOnDate(p.id, d.key);

                  return (
                    <div
                      class="border-b border-r p-1 min-h-[60px] bg-white"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const drag = dragStore.state();

                        // 新增指派
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
                      {/* 該格中的所有 assignment */}
                      <For each={items()}>
                        {(a) => (
                          <div
                            class="bg-blue-100 border border-blue-300 text-xs p-1 rounded mb-1 cursor-pointer"
                            draggable="true"
                            onDragStart={() => {
                              dragStore.startAssignmentDrag({
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
