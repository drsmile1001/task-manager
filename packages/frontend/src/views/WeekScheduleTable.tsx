import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import { useDragController } from "@frontend/stores/DragController";
import { usePanelController } from "@frontend/stores/PanelController";
import { useSharedFilterStore } from "@frontend/stores/SharedFilterStore";
import { useHolidayStore } from "@frontend/stores/holidayStore";
import { getLabelTextColor } from "@frontend/stores/labelStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { usePlanningStore } from "@frontend/stores/planningStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import {
  type TaskWithRelation,
  useTaskStore,
} from "@frontend/stores/taskStore";
import { addDays, format, startOfDay, startOfWeek } from "date-fns";
import { For, createMemo, createSignal } from "solid-js";
import { ulid } from "ulid";

type WeekEntry = {
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
  days: {
    date: string;
    isHoliday: boolean;
    isToday: boolean;
  }[];
};

const VIEW_WEEKS = 14;

export default function WeekScheduleTable() {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const currentWeekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
  const { getDateRecord } = useHolidayStore();
  const [viewStartWeek, setViewStartWeek] = createSignal(currentWeekStart);
  const { nonArchivedProjects } = useProjectStore();
  const { sharedFilter } = useSharedFilterStore();
  const { getPlanningsByWeekStartDate, getPlanningsByTask } =
    usePlanningStore();
  const { getTaskWithRelation } = useTaskStore();
  const { dragContext, setDragContext } = useDragController();
  const { getPerson } = usePersonStore();
  const { openPanel, pushPanel } = usePanelController();

  const weeks = createMemo(() => {
    const weeks: WeekEntry[] = [];
    for (let w = 0; w < VIEW_WEEKS; w++) {
      const weekStartDate = format(
        addDays(viewStartWeek(), w * 7),
        "yyyy-MM-dd"
      );
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const date = format(addDays(weekStartDate, d), "yyyy-MM-dd");
        const dateRecord = getDateRecord(date);
        const isToday = date === today;
        const isHoliday = dateRecord?.isHoliday ?? false;
        weekDays.push({ date, isHoliday, isToday });
      }

      weeks.push({
        name: `${format(weekStartDate, "YY", {
          useAdditionalWeekYearTokens: true,
        })} W${format(weekStartDate, "II")}`,
        startDate: weekStartDate,
        endDate: weekDays[6].date,
        current: weekStartDate === currentWeekStart,
        days: weekDays,
      });
    }
    return weeks;
  });

  function navigateWeeks(offset: number | "current") {
    if (offset === "current") {
      setViewStartWeek(currentWeekStart);
    } else {
      setViewStartWeek(
        format(addDays(viewStartWeek(), offset * 7), "yyyy-MM-dd")
      );
    }
  }

  function viewRangeText() {
    const ws = weeks()[0];
    const we = weeks()[weeks().length - 1];
    return `${ws.startDate} - ${we.endDate}`;
  }

  function projectWeekKey(projectId: string, weekStartDate: string) {
    return `${projectId}::${weekStartDate}`;
  }

  const projectWeekPlannings = createMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        taskId: string;
        weekStartDate: string;
        task: TaskWithRelation;
      }[]
    > = {};
    for (const week of weeks()) {
      const plannings = getPlanningsByWeekStartDate(week.startDate);
      for (const p of plannings) {
        const task = getTaskWithRelation(p.taskId);
        if (!task) continue;
        const key = projectWeekKey(task.projectId, week.startDate);
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push({
          id: p.id,
          taskId: p.taskId,
          weekStartDate: p.weekStartDate,
          task,
        });
      }
    }
    return map;
  });

  const data = createMemo(() => {
    return nonArchivedProjects()
      .filter((project) => {
        if (
          sharedFilter.projectIds.length &&
          !sharedFilter.projectIds.includes(project.id)
        )
          return false;
        return true;
      })
      .map((project) => ({
        id: project.id,
        name: project.name,
        byWeekData: weeks().map((week) => {
          const key = projectWeekKey(project.id, week.startDate);
          const plannings =
            projectWeekPlannings()[key]?.filter((p) => {
              const task = p.task;
              if (!sharedFilter.includeDoneTasks && task.isDone) return false;
              if (!sharedFilter.includeArchivedTasks && task.isArchived)
                return false;
              if (
                sharedFilter.labelIds.length &&
                !sharedFilter.labelIds.some((id) => task.labelIds.includes(id))
              )
                return false;
              if (
                sharedFilter.personIds.length &&
                !task.assigneeIds.some((id) =>
                  sharedFilter.personIds.includes(id)
                )
              )
                return false;

              return true;
            }) || [];
          return {
            week,
            plannings,
          };
        }),
      }));
  });

  function setTaskPlanning(taskId: string, weekStartDate: string) {
    const existingPlannings = getPlanningsByTask(taskId).filter(
      (p) => p.weekStartDate === weekStartDate
    );
    if (existingPlannings.length > 0) {
      return;
    }
    client.api.plannings.post({
      id: ulid(),
      taskId,
      weekStartDate,
    });
  }

  return (
    <div
      class="h-full w-full flex-1 p-4 overflow-hidden flex flex-col gap-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        e.preventDefault();
        const currentDragContext = dragContext();
        if (currentDragContext?.type === "PLANNING") {
          await client.api
            .plannings({ id: currentDragContext.planningId })
            .delete();
          setDragContext(null);
        }
      }}
    >
      <div class="flex-none flex flex-col gap-2">
        <div class="text-gray-700 font-bold">計劃表</div>
        <div class="flex gap-2 items-center">
          <Button variant="secondary" onClick={() => navigateWeeks("current")}>
            本週
          </Button>
          <Button variant="secondary" onClick={() => navigateWeeks(-8)}>
            -8 週
          </Button>
          {viewRangeText()}
          <Button variant="secondary" onClick={() => navigateWeeks(8)}>
            +8 週
          </Button>
          <Button
            variant="secondary"
            onclick={() => pushPanel({ type: "SHARED_FILTER" })}
          >
            篩選
          </Button>
        </div>
      </div>
      <div class="flex-1 overflow-auto">
        <div class="min-w-500 grid grid-cols-15">
          <div class="border-b border-r border-gray-400 p-2 sticky left-0 top-0 z-[3] bg-gray-100 font-semibold text-sm text-center select-none">
            專案 \ 週次
          </div>
          <For each={weeks()}>
            {(w) => (
              <div class="border-b border-r border-gray-300 border-b-gray-400 sticky top-0 z-[1] bg-gray-100 text-sm text-center flex flex-col select-none">
                <div class="grid grid-cols-7 h-12 border-b border-gray-200">
                  <For each={w.days}>
                    {(d) => (
                      <div
                        class="flex flex-col p-0.5 items-center justify-center text-xs border-r last:border-r-0 border-gray-200"
                        classList={{
                          "text-gray-500": !d.isToday && !d.isHoliday,
                          "text-blue-500": d.isToday && !d.isHoliday,
                          "bg-red-100": d.isHoliday,
                          "text-red-400": d.isHoliday,
                          "font-bold": d.isToday,
                        }}
                      >
                        <span>{format(d.date, "MM")}</span>
                        <span>{format(d.date, "dd")}</span>
                      </div>
                    )}
                  </For>
                </div>
                <div
                  class="py-1 font-bold"
                  classList={{
                    "text-blue-500": w.current,
                    "font-bold": w.current,
                  }}
                >
                  {w.name}
                </div>
              </div>
            )}
          </For>

          <For each={data()}>
            {(project) => (
              <>
                <div class="border-b border-r border-gray-300 border-r-gray-400 p-1 font-medium sticky left-0 z-[2] bg-gray-100 text-sm text-right">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() =>
                      openPanel({
                        type: "PROJECT_DETAILS",
                        projectId: project.id,
                      })
                    }
                  >
                    {project.name}
                  </Button>
                </div>
                <For each={project.byWeekData}>
                  {({ week, plannings }) => (
                    <div
                      class="border-b border-r border-gray-300 p-1"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const drag = dragContext();
                        if (drag?.type === "TASK") {
                          setTaskPlanning(drag.taskId, week.startDate);
                        }
                        if (drag?.type === "PLANNING") {
                          client.api
                            .plannings({
                              id: drag.planningId,
                            })
                            .patch({
                              weekStartDate: week.startDate,
                            });
                        }
                        setDragContext(null);
                      }}
                    >
                      <For each={plannings}>
                        {({ task, id }) => {
                          return (
                            <div
                              class="bg-blue-50 border border-blue-300 text-xs shadow p-1 rounded mb-1 cursor-pointer hover:bg-blue-100 select-none"
                              classList={{
                                "bg-gray-50 border-gray-300 text-gray-400 hover:bg-gray-100":
                                  task?.isArchived || task?.project?.isArchived,
                              }}
                              draggable="true"
                              onDragStart={() => {
                                setDragContext({
                                  type: "PLANNING",
                                  planningId: id,
                                  fromWeekStartDate: week.startDate,
                                });
                              }}
                              onClick={() => {
                                openPanel({
                                  type: "TASK",
                                  taskId: task?.id ?? "",
                                });
                              }}
                            >
                              <span
                                classList={{
                                  "line-through": task?.isDone,
                                }}
                              >
                                {task?.name}
                              </span>
                              <div class="flex flex-wrap items-center justify-between mt-1 gap-0.5">
                                <div class="flex flex-wrap gap-0.5">
                                  {(task?.assigneeIds ?? []).map(
                                    (assigneeId) => {
                                      const person = getPerson(assigneeId);
                                      if (!person) return null;
                                      return (
                                        <span class="px-1 py-0.5 rounded text-xs bg-gray-300 text-gray-800">
                                          {person.name}
                                        </span>
                                      );
                                    }
                                  )}
                                </div>

                                <div class="flex justify-end">
                                  {task?.labels.map((label) => (
                                    <span
                                      class="text-xs px-1 py-0.5 rounded mr-1"
                                      style={{
                                        "background-color": label.color,
                                        color: getLabelTextColor(label.color),
                                      }}
                                    >
                                      {label.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  )}
                </For>
              </>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
