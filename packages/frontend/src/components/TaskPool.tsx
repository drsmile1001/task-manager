import { client } from "@frontend/client";
import { useAssignmentStore } from "@frontend/stores/assignmentStore";
import { useDragStore } from "@frontend/stores/dragStore";
import { useFilterStore } from "@frontend/stores/filterStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import {
  type TaskWithRelation,
  useTaskStore,
} from "@frontend/stores/taskStore";
import { differenceInDays, format, isBefore, startOfDay } from "date-fns";
import { For, Show, createMemo, createSignal } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";
import LabelLine from "./LabelLine";

export type Props = {
  onEditTask: (taskId: string) => void;
};

type GroupType = "BY_PROJECT" | "BY_DUE_DATE";

export default function TaskPool(props: Props) {
  const { tasksWithRelation } = useTaskStore();
  const { filter } = useFilterStore();
  const [groupType, setGroupType] = createSignal<GroupType>("BY_PROJECT");

  const groupedTasks = createMemo(() => {
    const currentGroupType = groupType();
    const currentFilter = filter();
    const grouping = tasksWithRelation()
      .filter((task) => {
        if (currentFilter.includeDoneTasks === false && task.isDone) {
          return false;
        }
        if (currentFilter.includeArchivedTasks === false && task.isArchived) {
          return false;
        }
        if (
          currentFilter.projectIds &&
          currentFilter.projectIds.length > 0 &&
          !currentFilter.projectIds.includes(task.projectId)
        ) {
          return false;
        }
        if (
          !currentFilter.includeArchivedProjects &&
          task.project?.isArchived
        ) {
          return false;
        }
        return true;
      })
      .reduce(
        (acc, task) => {
          const key =
            currentGroupType === "BY_PROJECT"
              ? task.projectId
              : task.dueDate
                ? format(task.dueDate, "yyyy-MM-dd")
                : "_";
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(task);
          return acc;
        },
        {} as Record<string, TaskWithRelation[]>
      );

    return Object.entries(grouping)
      .map(([key, tasks]) => {
        let group = {
          type: currentGroupType,
          name: "",
          order: 0,
          key, // 新增 key 欄位
        };
        if (currentGroupType === "BY_PROJECT") {
          const project = useProjectStore().getProject(key);
          group.name = project ? project.name : "未分類專案";
          group.order = project?.order ?? Number.MAX_SAFE_INTEGER;
        } else {
          group.name = key === "_" ? "無到期日" : key;
          group.order =
            key === "_" ? Number.MAX_SAFE_INTEGER : new Date(key).getTime();
        }

        const sortedTasks = tasks.sort((a, b) => {
          const priorityA = a.priority;
          const priorityB = b.priority;
          const dueDateA = a.dueDate
            ? a.dueDate.getTime()
            : Number.MAX_SAFE_INTEGER;
          const dueDateB = b.dueDate
            ? b.dueDate.getTime()
            : Number.MAX_SAFE_INTEGER;
          if (currentGroupType === "BY_PROJECT") {
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            if (dueDateA !== dueDateB) {
              return dueDateA - dueDateB;
            }
            return a.name.localeCompare(b.name);
          } else {
            if (dueDateA !== dueDateB) {
              return dueDateA - dueDateB;
            }
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            const projectAOrder = a.project?.order ?? Number.MAX_SAFE_INTEGER;
            const projectBOrder = b.project?.order ?? Number.MAX_SAFE_INTEGER;
            if (projectAOrder !== projectBOrder) {
              return projectAOrder - projectBOrder;
            }
            const projectAName = a.project ? a.project.name : "";
            const projectBName = b.project ? b.project.name : "";
            if (projectAName !== projectBName) {
              return projectAName.localeCompare(projectBName);
            }
            return a.name.localeCompare(b.name);
          }
        });

        return {
          group,
          tasks: sortedTasks,
        };
      })
      .sort((a, b) => {
        if (a.group.order !== b.group.order) {
          return a.group.order - b.group.order;
        }
        return a.group.name.localeCompare(b.group.name);
      });
  });

  return (
    <div class="h-full flex-none w-[clamp(15rem,15vw,25rem)] border-r flex flex-col p-3 bg-gray-50">
      <div class="flex-none flex border-b mb-2 pb-2 gap-4 items-center">
        <h2 class="font-bold text-gray-700 flex-1">專案 & 工作</h2>
        <label class="inline-flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="radio"
            name="groupType"
            value="BY_PROJECT"
            checked={groupType() === "BY_PROJECT"}
            onInput={() => setGroupType("BY_PROJECT")}
          />
          <span>依專案</span>
        </label>
        <label class="inline-flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="radio"
            name="groupType"
            value="BY_DUE_DATE"
            checked={groupType() === "BY_DUE_DATE"}
            onInput={() => setGroupType("BY_DUE_DATE")}
          />
          <span>依到期日</span>
        </label>
      </div>
      <div class="flex-1 overflow-y-auto">
        <For each={groupedTasks()}>
          {({ group, tasks }) => (
            <div class="mb-6">
              <div class="font-semibold text-gray-700 flex items-center justify-between mb-2">
                <span>{group.name}</span>
                {groupType() === "BY_PROJECT" && (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={async () => {
                      const projectId = group.key;
                      const taskId = ulid();
                      await client.api.tasks.post({
                        id: taskId,
                        projectId: projectId,
                        name: "新工作",
                        description: "",
                        isDone: false,
                        labelIds: [],
                        isArchived: false,
                        dueDate: null,
                        assigneeIds: [],
                      });
                      props.onEditTask(taskId);
                    }}
                  >
                    ＋ 新增工作
                  </Button>
                )}
              </div>
              <div class="space-y-1 pl-2">
                <For each={tasks}>
                  {(t) => <TaskBlock {...props} t={t} groupType={groupType} />}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function TaskBlock(
  props: Props & { t: TaskWithRelation; groupType: () => GroupType }
) {
  const today = startOfDay(new Date());
  const { onEditTask, t, groupType } = props;
  const assigned = () => useAssignmentStore().listByTask(t.id).length > 0;
  const isArchived = () => t.isArchived || t.project?.isArchived;
  const isOverdue = () => (t.dueDate ? isBefore(t.dueDate, today) : false);
  const dayDiff = () =>
    t.dueDate ? differenceInDays(new Date(t.dueDate), today) : null;
  return (
    <div
      class="p-1 border rounded text-sm shadow cursor-pointer"
      classList={{
        "bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-400":
          isArchived(),
        "bg-red-50 border-red-400 hover:bg-red-100":
          !isArchived() && isOverdue(),
        "bg-green-50 border-green-400 hover:bg-green-100":
          !isArchived() && !isOverdue() && assigned(),
        "bg-yellow-50 border-yellow-400 hover:bg-yellow-100":
          !isArchived() && !isOverdue() && !assigned(),
        "line-through": t.isDone,
      }}
      onClick={() => onEditTask(t.id)}
      draggable="true"
      onDragStart={() => {
        useDragStore().startTaskDrag(t.id);
      }}
    >
      <div class="flex justify-between items-center mb-1">
        <div>
          <Show when={groupType() !== "BY_PROJECT"}>
            <span>{t.project?.name}:</span>
          </Show>
          <span>{t.name}</span>
        </div>

        <span>
          {t.dueDate ? `${format(t.dueDate, "MM-dd")} (${dayDiff()})` : ""}
        </span>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex gap-1">
          <For each={t.assigneeIds}>
            {(assigneeId) => {
              const { getPerson } = usePersonStore();
              const person = getPerson(assigneeId);
              if (!person) return null;
              return (
                <span class="px-1 py-0.5 rounded text-xs bg-gray-300 text-gray-800">
                  {person.name}
                </span>
              );
            }}
          </For>
        </div>
        <LabelLine labelIds={() => t.labelIds ?? []} />
      </div>
    </div>
  );
}
