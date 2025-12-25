import { client } from "@frontend/client";
import { assignmentStore } from "@frontend/stores/assignmentStore";
import { dragStore } from "@frontend/stores/dragStore";
import { filterStore } from "@frontend/stores/filterStore";
import { personStore } from "@frontend/stores/personStore";
import { projectStore } from "@frontend/stores/projectStore";
import { taskStore } from "@frontend/stores/taskStore";
import { addDays, format, isAfter, startOfDay } from "date-fns";
import { For, createMemo } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";

export type Props = {
  onClickAssignment?: (assignmentId: string) => void;
};

export default function ScheduleTable(props: Props) {
  const tasksMap = createMemo(() => {
    const projects = projectStore.projects();
    const tasks = taskStore.tasks();
    return Object.fromEntries(
      tasks.map((t) => {
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
    const dates: {
      key: string;
      label: string;
      isWeekend: boolean;
      isToday: boolean;
    }[] = [];
    let curr = startDate;
    while (!isAfter(curr, endDate)) {
      dates.push({
        key: format(curr, "yyyy-MM-dd"),
        label: format(curr, "MM/dd E"),
        isWeekend: [0, 6].includes(curr.getDay()),
        isToday:
          startOfDay(curr).valueOf() === startOfDay(new Date()).valueOf(),
      });
      curr = addDays(curr, 1);
    }
    return dates;
  });

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
        <Button variant="secondary" onclick={filterStore.toCurrentWeek}>
          本週
        </Button>
        <Button variant="secondary" onclick={filterStore.toPreviousWeek}>
          上週
        </Button>
        {format(filterStore.filter().startDate, "yyyy-MM-dd")} -{" "}
        {format(filterStore.filter().endDate, "yyyy-MM-dd")}
        <Button variant="secondary" onclick={filterStore.toNextWeek}>
          {" "}
          下週{" "}
        </Button>
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
              <div
                class="border-b border-r border-black p-2 bg-gray-100 text-sm text-center w-30"
                classList={{
                  "font-bold": d.isToday,
                  "text-blue-500": d.isToday,
                  "bg-red-100": d.isWeekend,
                  "bg-gray-100": !d.isWeekend,
                }}
              >
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
                        class="border-b border-r p-1 min-h-[60px]"
                        classList={{
                          "bg-red-50": d.isWeekend,
                          "bg-white": !d.isWeekend,
                        }}
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
                            const task = () => tasksMap()[a.taskId];

                            const cssClass =
                              "bg-blue-100 border border-blue-300 text-xs p-1 rounded mb-1 cursor-pointer" +
                              (task()?.task.isDone ? " line-through" : "");

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
                                onClick={() => {
                                  props.onClickAssignment?.(a.id);
                                }}
                              >
                                {task()?.project?.name}:{task()?.task.name}
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
