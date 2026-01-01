import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import { useDragController } from "@frontend/stores/DragController";
import { usePanelController } from "@frontend/stores/PanelController";
import { useAssignmentStore } from "@frontend/stores/assignmentStore";
import { useFilterStore } from "@frontend/stores/filterStore";
import { useHolidayStore } from "@frontend/stores/holidayStore";
import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { For, createMemo } from "solid-js";
import { ulid } from "ulid";

export default function ScheduleTable() {
  const { dragContext, setDragContext } = useDragController();
  const { openPanel } = usePanelController();
  const tasksMap = createMemo(() => {
    const projects = useProjectStore().projects();
    const tasks = useTaskStore().tasksWithRelation();
    const labels = useLabelStore().labels();
    return Object.fromEntries(
      tasks.map((t) => {
        return [
          t.id,
          {
            task: t,
            labels: labels
              .filter((l) => t.labelIds?.includes(l.id))
              .sort((a, b) => {
                const pa = a.priority ?? Number.MAX_SAFE_INTEGER;
                const pb = b.priority ?? Number.MAX_SAFE_INTEGER;
                if (pa !== pb) return pa - pb;
                return a.name.localeCompare(b.name);
              }),
            project: projects.find((p) => p.id === t.projectId),
          },
        ];
      })
    );
  });

  const { filteredPersons } = usePersonStore();
  const { getProject } = useProjectStore();
  const days = createMemo(() => {
    const { startDate, endDate } = useFilterStore().filter();
    const allMilestones = useMilestoneStore().milestones();

    const dates: {
      key: string;
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
    let curr = startDate;
    while (isBefore(curr, endDate)) {
      const record = useHolidayStore().getDateRecord(curr);
      const milestonesInDate = allMilestones
        .filter((m) => {
          if (!m.dueDate) return false;
          const dueDate = startOfDay(new Date(m.dueDate));
          return dueDate.valueOf() === startOfDay(curr).valueOf();
        })
        .map((m) => ({
          id: m.id,
          name: m.name,
          projectName: getProject(m.projectId)?.name ?? "未知專案",
        }));
      dates.push({
        key: format(curr, "yyyy-MM-dd"),
        label: format(curr, "MM/dd E"),
        description: record?.description ?? "",
        isHoliday: record?.isHoliday ?? false,
        isToday:
          startOfDay(curr).valueOf() === startOfDay(new Date()).valueOf(),
        milestonesInDate,
      });
      curr = addDays(curr, 1);
    }
    return dates;
  });

  const currentWeekText = () => {
    const { startDate, endDate } = useFilterStore().filter();
    return `${format(startDate, "yyyy-MM-dd")} - ${format(endDate, "yyyy-MM-dd")}`;
  };

  return (
    <div
      class="h-full flex-1 p-4 overflow-hidden flex flex-col gap-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        // 拖拽到空白區域則刪除指派
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
          <Button variant="secondary" onclick={useFilterStore().toCurrentWeek}>
            本週
          </Button>
          <Button variant="secondary" onclick={useFilterStore().toPreviousWeek}>
            上週
          </Button>
          {currentWeekText()}
          <Button variant="secondary" onclick={useFilterStore().toNextWeek}>
            下週
          </Button>
          <Button
            variant="secondary"
            onclick={() => openPanel({ type: "Filter" })}
          >
            篩選
          </Button>
          <Button
            variant="secondary"
            onclick={() => openPanel({ type: "TaskPool" })}
          >
            工作總覽
          </Button>
          <Button
            variant="secondary"
            onclick={() => openPanel({ type: "Person" })}
          >
            人員
          </Button>
          <Button
            variant="secondary"
            onclick={() => openPanel({ type: "Label" })}
          >
            標籤
          </Button>
          <Button
            variant="secondary"
            onclick={() => openPanel({ type: "ProjectList" })}
          >
            專案
          </Button>
          <Button
            variant="secondary"
            onclick={() => openPanel({ type: "ImportTasks" })}
          >
            匯入工作
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
            人員 \ 日期
          </div>
          <For each={days()}>
            {(d) => (
              <div
                class="border-b border-r border-black p-2 sticky top-0 z-[1] bg-gray-100 text-sm text-center flex flex-col items-center select-none"
                classList={{
                  "font-bold": d.isToday,
                  "text-blue-500": d.isToday,
                  "bg-red-100": d.isHoliday,
                  "bg-gray-100": !d.isHoliday,
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
                        dueDate: new Date(d.key),
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
                      class="mt-1 px-1 py-0.5 bg-yellow-100 border border-yellow-300 rounded text-xs cursor-pointer hover:bg-yellow-200 slect-none"
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

          <For each={filteredPersons()}>
            {(p) => (
              <>
                <div class="border-b border-r p-2 font-medium sticky left-0 z-[2] bg-white">
                  {p.name}
                </div>
                <For each={days()}>
                  {(d) => {
                    const items = () =>
                      useAssignmentStore()
                        .listForPersonOnDate(p.id, d.key)
                        .map((assignment) => {
                          const task = tasksMap()[assignment.taskId];
                          return {
                            assignment,
                            task: task?.task,
                            project: task?.project,
                            labels: task?.labels ?? [],
                          };
                        })
                        .filter(({ task, project }) => {
                          const {
                            includeDoneTasks,
                            includeArchivedProjects,
                            includeArchivedTasks,
                            projectIds,
                            labelIds,
                          } = useFilterStore().filter();
                          if (includeDoneTasks === false && task?.isDone)
                            return false;
                          if (
                            includeArchivedProjects === false &&
                            project?.isArchived
                          )
                            return false;
                          if (
                            includeArchivedTasks === false &&
                            task?.isArchived
                          )
                            return false;
                          if (
                            projectIds &&
                            projectIds.length > 0 &&
                            !projectIds?.includes(task.projectId)
                          )
                            return false;
                          if (labelIds && labelIds.length > 0) {
                            const hasLabels = labelIds.some((labelId) =>
                              task.labelIds?.includes(labelId)
                            );
                            if (!hasLabels) return false;
                          }
                          return true;
                        })
                        .sort((a, b) => {
                          const pa =
                            a.labels[0]?.priority ?? Number.MAX_SAFE_INTEGER;
                          const pb =
                            b.labels[0]?.priority ?? Number.MAX_SAFE_INTEGER;
                          if (pa !== pb) return pa - pb;
                          const projectAName = a.project?.name ?? "";
                          const projectBName = b.project?.name ?? "";
                          if (projectAName !== projectBName)
                            return projectAName.localeCompare(projectBName);
                          return (a.task?.name ?? "").localeCompare(
                            b.task?.name ?? ""
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

                          const drag = dragContext();

                          if (drag?.type === "task") {
                            await client.api.assignments.post({
                              id: ulid(),
                              taskId: drag.taskId,
                              personId: p.id,
                              date: d.key,
                            });
                          } else if (drag?.type === "assignment") {
                            await client.api
                              .assignments({
                                id: drag.assignmentId,
                              })
                              .patch({
                                personId: p.id,
                                date: d.key,
                              });
                          }
                          setDragContext(null);
                        }}
                      >
                        <For each={items()}>
                          {({ assignment, task, project, labels }) => {
                            return (
                              <div
                                class="bg-blue-50 border border-blue-300 text-xs shadow p-1 rounded mb-1 cursor-pointer hover:bg-blue-100 select-none"
                                classList={{
                                  "bg-gray-50 border-gray-300 text-gray-400 hover:bg-gray-100":
                                    task?.isArchived || project?.isArchived,
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
                                  openPanel({ type: "Task", taskId: task.id });
                                }}
                              >
                                <span>
                                  {project?.name}:{task?.name}
                                </span>
                                <div class="flex flex-wrap items-center justify-between mt-1 gap-0.5">
                                  <div class="flex flex-wrap gap-0.5">
                                    {(task?.assigneeIds ?? []).map(
                                      (assigneeId) => {
                                        const { getPerson } = usePersonStore();
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
                                    {labels.map((label) => (
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
