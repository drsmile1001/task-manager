import { client } from "@frontend/client";
import { assignmentStore } from "@frontend/stores/assignmentStore";
import { dragStore } from "@frontend/stores/dragStore";
import { filterStore } from "@frontend/stores/filterStore";
import { holidayStore } from "@frontend/stores/holidayStore";
import { personStore } from "@frontend/stores/personStore";
import { projectStore } from "@frontend/stores/projectStore";
import { taskStore } from "@frontend/stores/taskStore";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { For, createMemo } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";

export type Props = {
  onClickAssignment?: (assignmentId: string) => void;
  onClickShowFilter?: () => void;
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
      description: string;
      isHoliday: boolean;
      isToday: boolean;
    }[] = [];
    let curr = startDate;
    while (isBefore(curr, endDate)) {
      const record = holidayStore.getDateRecord(curr);
      dates.push({
        key: format(curr, "yyyy-MM-dd"),
        label: format(curr, "MM/dd E"),
        description: record?.description ?? "",
        isHoliday: record?.isHoliday ?? false,
        isToday:
          startOfDay(curr).valueOf() === startOfDay(new Date()).valueOf(),
      });
      curr = addDays(curr, 1);
    }
    return dates;
  });

  const currentWeekText = () => {
    const { startDate, endDate } = filterStore.filter();
    return `${format(startDate, "yyyy-MM-dd")} - ${format(endDate, "yyyy-MM-dd")}`;
  };

  return (
    <div
      class="h-full flex-1 p-4 overflow-hidden flex flex-col gap-4"
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
      <div class="flex-none flex flex-col gap-2">
        <div class="text-gray-700 font-bold">工作表</div>
        <div class="flex gap-2 items-center">
          <Button variant="secondary" onclick={filterStore.toCurrentWeek}>
            本週
          </Button>
          <Button variant="secondary" onclick={filterStore.toPreviousWeek}>
            上週
          </Button>
          {currentWeekText()}
          <Button variant="secondary" onclick={filterStore.toNextWeek}>
            下週
          </Button>
          <Button variant="secondary" onclick={props.onClickShowFilter}>
            篩選
          </Button>
        </div>
      </div>

      <div class="flex-1 w-full overflow-auto">
        <div
          class="grid"
          style={{
            "grid-template-columns": `repeat(${days().length + 1}, clamp(6rem, 6vw, 8rem))`,
          }}
        >
          <div class="border-b border-r p-2 sticky left-0 top-0 z-[3] bg-gray-100 font-semibold text-sm">
            人員
          </div>
          <For each={days()}>
            {(d) => (
              <div
                class="border-b border-r border-black p-2 sticky top-0 z-[1] bg-gray-100 text-sm text-center flex flex-col items-center"
                classList={{
                  "font-bold": d.isToday,
                  "text-blue-500": d.isToday,
                  "bg-red-100": d.isHoliday,
                  "bg-gray-100": !d.isHoliday,
                }}
              >
                <span>{d.label}</span>
                <span class="text-xs">{d.description}</span>
              </div>
            )}
          </For>

          <For each={persons()}>
            {(p) => (
              <>
                <div class="border-b border-r p-2 font-medium sticky left-0 z-[2] bg-white">
                  {p.name}
                </div>
                <For each={days()}>
                  {(d) => {
                    const items = () =>
                      assignmentStore
                        .listForPersonOnDate(p.id, d.key)
                        .filter((a) => {
                          const { includeDoneTasks, projectId } =
                            filterStore.filter();
                          const task = tasksMap()[a.taskId];
                          return (
                            (includeDoneTasks || !task?.task.isDone) &&
                            (projectId ? task?.project?.id === projectId : true)
                          );
                        });

                    return (
                      <div
                        class="border-b border-r p-1 min-h-[60px]"
                        classList={{
                          "bg-red-50": d.isHoliday,
                          "bg-white": !d.isHoliday,
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
