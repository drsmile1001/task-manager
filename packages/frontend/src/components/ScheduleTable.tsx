import { client } from "@frontend/client";
import type { FilterStore } from "@frontend/stores/filterStore";
import type { PersonStore } from "@frontend/stores/personStore";
import { addDays, format, isAfter } from "date-fns";
import { For, createMemo } from "solid-js";
import { ulid } from "ulid";

import type { AssignmentStore } from "../stores/assignmentStore";
import type { DragStore } from "../stores/dragStore";
import type { ProjectStore } from "../stores/projectStore";
import type { TaskStore } from "../stores/taskStore";

export type Props = {
  personStore: PersonStore;
  filterStore: FilterStore;
  assignmentStore: AssignmentStore;
  taskStore: TaskStore;
  projectStore: ProjectStore;
  dragStore: DragStore;
};

export default function ScheduleTable(props: Props) {
  const { personStore, filterStore, assignmentStore, taskStore, dragStore } =
    props;

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

  const days = createMemo(() => {
    const { startDate, endDate } = filterStore.filter();
    const dates: { key: string; label: string }[] = [];
    let curr = startDate;
    while (!isAfter(curr, endDate)) {
      dates.push({
        key: curr.valueOf().toString(),
        label: format(curr, "MM/dd"),
      });
      curr = addDays(curr, 1);
    }
    return dates;
  });

  function startInput() {
    return format(filterStore.filter().startDate, "yyyy-MM-dd");
  }
  function setStart(value: string) {
    const date = new Date(value);
    filterStore.setFilter({
      ...filterStore.filter(),
      startDate: date,
    });
  }
  function endInput() {
    return format(filterStore.filter().endDate, "yyyy-MM-dd");
  }
  function setEnd(value: string) {
    const date = new Date(value);
    filterStore.setFilter({
      ...filterStore.filter(),
      endDate: date,
    });
  }

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
      <div class="flex gap-2 mb-4 items-center">
        <label class="mr-2 self-center">日期範圍：</label>
        <input
          type="date"
          class="border"
          value={startInput()}
          onInput={(e) => setStart(e.currentTarget.value)}
        />
        <input
          type="date"
          class="border"
          value={endInput()}
          onInput={(e) => setEnd(e.currentTarget.value)}
        />
      </div>

      <div class="border border-gray-300 h-[calc(100vh-100px)] overflow-y-auto">
        <div
          class="grid"
          style={{
            "grid-template-columns": `120px repeat(${days().length}, 1fr)`,
          }}
        >
          {/* 表頭：日期 */}
          <div class="border-b border-r p-2 bg-gray-100 font-semibold text-sm">
            人員
          </div>

          <For each={days()}>
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
                <For each={days()}>
                  {(d) => {
                    const items = () =>
                      assignmentStore.listForPersonOnDate(p.id, d.key);

                    return (
                      <div
                        class="border-b border-r p-1 min-h-[60px] bg-white"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

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
