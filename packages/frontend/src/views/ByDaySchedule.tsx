import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import { useDragController } from "@frontend/stores/DragController";
import { usePanelController } from "@frontend/stores/PanelController";
import { useSharedFilterStore } from "@frontend/stores/SharedFilterStore";
import { useAssignmentStore } from "@frontend/stores/assignmentStore";
import { useHolidayStore } from "@frontend/stores/holidayStore";
import { getLabelTextColor } from "@frontend/stores/labelStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { addDays, format, startOfDay, startOfWeek } from "date-fns";
import { For, createMemo, createSignal } from "solid-js";
import { ulid } from "ulid";

const VIEW_DAYS = 14;

export default function ByDaySchedule() {
  const { openPanel } = usePanelController();
  const { dragContext, setDragContext } = useDragController();
  const { persons } = usePersonStore();
  const { getProject } = useProjectStore();
  const { getDateRecord } = useHolidayStore();
  const { sharedFilter } = useSharedFilterStore();
  const { milestones } = useMilestoneStore();
  const today = startOfDay(new Date());
  const currentWeekStart = startOfWeek(today);
  const [viewStartDate, setViewStartDate] = createSignal(currentWeekStart);
  const { getAssignmentsByPersonAndDate } = useAssignmentStore();
  const { getTaskWithRelation } = useTaskStore();

  function navigateViewRange(offset: number | "current") {
    if (offset === "current") {
      setViewStartDate(currentWeekStart);
    } else {
      setViewStartDate(addDays(viewStartDate(), offset * 7));
    }
  }

  const days = createMemo(() => {
    const allMilestones = milestones();
    const dates: {
      date: string;
      label: string;
      description: string;
      isHoliday: boolean;
      isToday: boolean;
      milestonesInDate: {
        id: string;
        name: string;
        projectName: string;
      }[];
    }[] = [];

    for (let d = 0; d < VIEW_DAYS; d++) {
      const date = format(addDays(viewStartDate(), d), "yyyy-MM-dd");
      const record = getDateRecord(date);
      const milestonesInDate = allMilestones
        .filter((m) => m.dueDate === date)
        .map((m) => ({
          id: m.id,
          name: m.name,
          projectName: getProject(m.projectId)?.name ?? "未知專案",
        }));
      dates.push({
        date,
        label: format(date, "MM/dd E"),
        description: record?.description ?? "",
        isHoliday: record?.isHoliday ?? false,
        isToday: date === format(today, "yyyy-MM-dd"),
        milestonesInDate,
      });
    }
    return dates;
  });

  const currentRangeText = () => {
    const start = days()[0];
    const end = days()[days().length - 1];
    return `${start.date} - ${end.date}`;
  };

  function data() {
    return persons()
      .filter(
        (p) =>
          sharedFilter.personIds.length === 0 ||
          sharedFilter.personIds.includes(p.id)
      )
      .map((person) => {
        const daysData = days().map((day) => ({
          day,
          assignments: getAssignmentsByPersonAndDate(person.id, day.date)
            .map((assignment) => {
              const task = getTaskWithRelation(assignment.taskId);
              return {
                assignment,
                task,
              };
            })
            .filter(({ task }) => {
              if (sharedFilter.includeDoneTasks === false && task?.isDone)
                return false;
              if (
                sharedFilter.includeArchivedTasks === false &&
                (task?.isArchived || task?.project?.isArchived)
              )
                return false;
              if (
                sharedFilter.projectIds.length &&
                !sharedFilter.projectIds.includes(task?.projectId ?? "")
              )
                return false;
              if (
                sharedFilter.milestoneIds.length &&
                !sharedFilter.milestoneIds.includes(task?.milestoneId ?? "")
              )
                return false;
              if (
                sharedFilter.labelIds.length &&
                !sharedFilter.labelIds.some((i) =>
                  task?.labelIds.some((labelId) => labelId === i)
                )
              )
                return false;
              return true;
            })
            .sort((a, b) => {
              const pa = a.task?.priority ?? Number.MAX_SAFE_INTEGER;
              const pb = b.task?.priority ?? Number.MAX_SAFE_INTEGER;
              if (pa !== pb) return pa - pb;
              const projectAName = a.task?.project?.name ?? "";
              const projectBName = b.task?.project?.name ?? "";
              if (projectAName !== projectBName)
                return projectAName.localeCompare(projectBName);
              return (a.task?.name ?? "").localeCompare(b.task?.name ?? "");
            }),
        }));

        return {
          id: person.id,
          name: person.name,
          daysData,
        };
      });
  }

  return (
    <div
      class="h-full w-full flex-1 p-4 overflow-hidden flex flex-col gap-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        e.preventDefault();
        const currentDragContext = dragContext();
        if (currentDragContext?.type === "assignment") {
          await client.api
            .assignments({ id: currentDragContext.assignmentId })
            .delete();
          setDragContext(null);
        }
      }}
    >
      <div class="flex-none flex flex-col gap-2">
        <div class="text-gray-700 font-bold">工作表</div>
        <div class="flex gap-2 items-center">
          <Button
            variant="secondary"
            onclick={() => navigateViewRange("current")}
          >
            本週
          </Button>
          <Button variant="secondary" onclick={() => navigateViewRange(-1)}>
            上週
          </Button>
          {currentRangeText()}
          <Button variant="secondary" onclick={() => navigateViewRange(1)}>
            下週
          </Button>
          <Button
            variant="secondary"
            onclick={() => openPanel({ type: "SharedFilter" })}
          >
            篩選
          </Button>
        </div>
      </div>
      <div class="flex-1 overflow-auto">
        <div class="min-w-500 grid grid-cols-15">
          <div class="border-b border-r border-gray-400 p-2 sticky left-0 top-0 z-[3] bg-gray-100 font-semibold text-sm text-center select-none">
            人員 \ 日期
          </div>
          <For each={days()}>
            {(d) => (
              <div
                class="border-b border-r border-gray-300 border-b-gray-400 sticky top-0 z-[1] bg-gray-100 text-sm text-center
                p-1 flex flex-col select-none"
                classList={{
                  "font-bold": d.isToday,
                  "text-blue-500": d.isToday,
                  "bg-gray-100": !d.isHoliday,
                  "bg-red-100": d.isHoliday,
                  "text-red-400": d.isHoliday,
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const drag = dragContext();
                  if (drag?.type === "milestone") {
                    await client.api
                      .milestones({ id: drag.milestoneId })
                      .patch({
                        dueDate: d.date,
                      });
                  }
                  setDragContext(null);
                }}
              >
                <span>{d.label}</span>
                <span class="text-xs">{d.description}</span>
                <For each={d.milestonesInDate}>
                  {(m) => (
                    <div
                      class="mt-1 px-1 py-0.5 bg-yellow-100 border border-yellow-300 rounded text-xs cursor-pointer hover:bg-yellow-200 select-none"
                      onClick={() =>
                        openPanel({ type: "Milestone", milestoneId: m.id })
                      }
                      draggable="true"
                      onDragStart={() => {
                        setDragContext({
                          type: "milestone",
                          milestoneId: m.id,
                        });
                      }}
                    >
                      {m.projectName}:{m.name}
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>

          <For each={data()}>
            {(p) => (
              <>
                <div class="border-b border-r border-gray-300 border-r-gray-400 p-1 font-medium sticky left-0 z-[2] bg-gray-100 text-sm text-right">
                  {p.name}
                </div>
                <For each={p.daysData}>
                  {({ day, assignments }) => (
                    <div
                      class="border-b border-r border-gray-300 p-1"
                      classList={{
                        "bg-red-50": day.isHoliday,
                        "bg-white": !day.isHoliday,
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const drag = dragContext();
                        if (drag?.type === "task") {
                          await client.api.assignments.post({
                            id: ulid(),
                            taskId: drag.taskId,
                            personId: p.id,
                            date: day.date,
                          });
                        } else if (drag?.type === "assignment") {
                          await client.api
                            .assignments({
                              id: drag.assignmentId,
                            })
                            .patch({
                              personId: p.id,
                              date: day.date,
                            });
                        }
                        setDragContext(null);
                      }}
                    >
                      <For each={assignments}>
                        {({ assignment, task }) => {
                          return (
                            <div
                              class="bg-blue-50 border border-blue-300 text-xs shadow p-1 rounded mb-1 cursor-pointer hover:bg-blue-100 select-none"
                              classList={{
                                "bg-gray-50 border-gray-300 text-gray-400 hover:bg-gray-100":
                                  task?.isArchived || task?.project?.isArchived,
                                "line-through": task?.isDone,
                              }}
                              draggable="true"
                              onDragStart={() => {
                                setDragContext({
                                  type: "assignment",
                                  assignmentId: assignment.id,
                                  fromPersonId: assignment.personId,
                                  fromDate: assignment.date,
                                });
                              }}
                              onClick={() => {
                                openPanel({
                                  type: "Task",
                                  taskId: task?.id ?? "",
                                });
                              }}
                            >
                              <span>
                                {task?.project?.name}:{task?.name}
                              </span>
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
