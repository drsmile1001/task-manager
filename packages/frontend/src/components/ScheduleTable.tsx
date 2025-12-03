import { client } from "@frontend/client";
import type { PersonStore } from "@frontend/stores/personStore";
import { For, createMemo } from "solid-js";
import { ulid } from "ulid";

import type { AssignmentStore } from "../stores/assignmentStore";
import type { DragStore } from "../stores/dragStore";
import type { ProjectStore } from "../stores/projectStore";
import type { TaskStore } from "../stores/taskStore";

export type Props = {
  personStore: PersonStore;
  week: { key: string; label: string }[];
  assignmentStore: AssignmentStore;
  taskStore: TaskStore;
  projectStore: ProjectStore;
  dragStore: DragStore;
};

export default function ScheduleTable(props: Props) {
  const { personStore, week, assignmentStore, taskStore, dragStore } = props;

  // project + task 名稱組合
  const tasksMap = createMemo(() => {
    const projects = props.projectStore.projects();
    return Object.fromEntries(
      taskStore.tasks().map((t) => {
        return [
          t.id,
          {
            task: t,
            project: projects.find((p) => p.id === t.projectId),
          },
        ];
      })
    );
  });

  const persons = () => personStore.persons();

  return (
    <div
      class="flex-1 overflow-auto p-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        // 拖拽到空白區域則刪除指派
        e.preventDefault();
        const drag = dragStore.state();
        if (drag.type === "assignment") {
          await client.api.assignments({ id: drag.assignmentId }).delete();
        }
        dragStore.clear();
      }}
    >
      <div class="text-gray-700 font-bold mb-3">工作表</div>

      <div class="border border-gray-300 h-[calc(100vh-100px)] overflow-y-auto">
        <div
          class="grid"
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
          <For each={persons()}>
            {(p) => (
              <>
                {/* 左欄：人名 */}
                <div class="border-b border-r p-2 font-medium sticky left-0 z-[2] bg-white">
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
                        onDrop={async (e) => {
                          e.preventDefault();
                          const drag = dragStore.state();

                          if (drag.type === "task") {
                            await client.api.assignments.post({
                              id: ulid(),
                              taskId: drag.taskId,
                              personId: p.id,
                              date: d.key,
                            });
                          } else if (drag.type === "assignment") {
                            await client.api
                              .assignments({
                                id: drag.assignmentId,
                              })
                              .patch({
                                personId: p.id,
                                date: d.key,
                              });
                          }

                          dragStore.clear();
                        }}
                      >
                        {/* 該格中的所有 assignment */}
                        <For each={items()}>
                          {(a) => {
                            const { task, project } = tasksMap()[a.taskId];
                            const cssClass =
                              "bg-blue-100 border border-blue-300 text-xs p-1 rounded mb-1 cursor-pointer" +
                              (task.isDone ? " line-through" : "");

                            return (
                              <div
                                class={cssClass}
                                draggable="true"
                                onDragStart={() => {
                                  dragStore.startAssignmentDrag({
                                    assignmentId: a.id,
                                    personId: a.personId,
                                    date: a.date,
                                  });
                                }}
                              >
                                {project?.name}:{task.name}
                              </div>
                            );
                          }}
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
    </div>
  );
}
