import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Panel, { PanelList } from "@frontend/components/Panel";
import { TaskBlock } from "@frontend/components/TaskBlock";
import { usePanelController } from "@frontend/stores/PanelController";
import { useSharedFilterStore } from "@frontend/stores/SharedFilterStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import {
  type TaskWithRelation,
  useTaskStore,
} from "@frontend/stores/taskStore";
import { format } from "date-fns";
import { For, Show, createMemo, createSignal } from "solid-js";
import { ulid } from "ulid";

type GroupType = "BY_PROJECT" | "BY_PROJECT_MILESTONE" | "BY_DUE_DATE";

export default function TaskPool() {
  const { tasksWithRelation } = useTaskStore();
  const { sharedFilter } = useSharedFilterStore();
  const [groupType, setGroupType] = createSignal<GroupType>("BY_PROJECT");
  const { pushPanel } = usePanelController();
  const { getProject } = useProjectStore();
  const { getMilestone } = useMilestoneStore();

  const groupedTasks = createMemo(() => {
    const currentGroupType = groupType();
    const grouping = tasksWithRelation()
      .filter((task) => {
        if (sharedFilter.includeDoneTasks === false && task.isDone) {
          return false;
        }
        if (
          sharedFilter.includeArchivedTasks === false &&
          (task.isArchived || task.project?.isArchived)
        ) {
          return false;
        }
        if (
          sharedFilter.projectIds.length &&
          !sharedFilter.projectIds.includes(task.projectId)
        ) {
          return false;
        }
        if (
          sharedFilter.labelIds.length &&
          !sharedFilter.labelIds.some((labelId) =>
            task.labelIds.includes(labelId)
          )
        )
          return false;
        if (
          sharedFilter.personIds.length &&
          !task.assigneeIds.some((assigneeId) =>
            sharedFilter.personIds.includes(assigneeId)
          )
        ) {
          return false;
        }
        if (
          sharedFilter.milestoneIds.length &&
          !sharedFilter.milestoneIds.includes(task.milestoneId ?? "")
        ) {
          return false;
        }

        return true;
      })
      .reduce(
        (acc, task) => {
          let key = "_";
          if (currentGroupType === "BY_PROJECT") {
            key = task.projectId;
          } else if (currentGroupType === "BY_PROJECT_MILESTONE") {
            key = `${task.projectId}::${task.milestoneId ?? "_"}`;
          } else if (currentGroupType === "BY_DUE_DATE") {
            key = task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "_";
          }
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
          const project = getProject(key);
          group.name = project ? project.name : "未分類專案";
          group.order = project?.order ?? Number.MAX_SAFE_INTEGER;
        }
        if (currentGroupType === "BY_PROJECT_MILESTONE") {
          const [projectId, milestoneId] = key.split("::");
          const milestone = getMilestone(milestoneId);
          const project = getProject(projectId);
          group.name = milestone
            ? `${project?.name} ${milestone.name}`
            : `${project?.name}`;
          group.order = milestone?.dueDate
            ? new Date(milestone.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
        }
        if (currentGroupType === "BY_DUE_DATE") {
          group.name = key === "_" ? "無到期日" : key;
          group.order =
            key === "_" ? Number.MAX_SAFE_INTEGER : new Date(key).getTime();
        }

        const sortedTasks = tasks.sort((a, b) => {
          const priorityA = a.priority;
          const priorityB = b.priority;
          const dueDateA = a.dueDate
            ? new Date(a.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          const dueDateB = b.dueDate
            ? new Date(b.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          if (currentGroupType === "BY_PROJECT") {
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            if (dueDateA !== dueDateB) {
              return dueDateA - dueDateB;
            }
            return a.name.localeCompare(b.name);
          }
          if (currentGroupType === "BY_PROJECT_MILESTONE") {
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            if (dueDateA !== dueDateB) {
              return dueDateA - dueDateB;
            }
            return a.name.localeCompare(b.name);
          }
          if (currentGroupType === "BY_DUE_DATE") {
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
          return a.name.localeCompare(b.name);
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
    <Panel
      title="工作總覽"
      actions={
        <div class="flex items-center gap-1">
          <Button
            variant="secondary"
            size="small"
            onClick={() => pushPanel({ type: "SHARED_FILTER" })}
          >
            篩選
          </Button>
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
              value="BY_MILESTONE"
              checked={groupType() === "BY_PROJECT_MILESTONE"}
              onInput={() => setGroupType("BY_PROJECT_MILESTONE")}
            />
            <span>依專案里程碑</span>
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
      }
    >
      <PanelList items={groupedTasks}>
        {({ group, tasks }) => (
          <div class="w-full">
            <div class="font-semibold text-gray-700 flex items-center justify-between mb-2">
              <span>{group.name}</span>
              <Show when={groupType() === "BY_PROJECT"}>
                <div class="flex gap-1">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() =>
                      pushPanel({
                        type: "PROJECT_DETAILS",
                        projectId: group.key,
                      })
                    }
                  >
                    詳細
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={async () => {
                      const projectId = group.key;
                      const taskId = ulid();
                      await client.api.tasks.post({
                        id: taskId,
                        projectId: projectId,
                        milestoneId: null,
                        name: "新工作",
                        description: "",
                        isDone: false,
                        labelIds: [],
                        isArchived: false,
                        dueDate: null,
                        assigneeIds: [],
                      });
                      pushPanel({ type: "TASK", taskId });
                    }}
                  >
                    ＋ 新增工作
                  </Button>
                </div>
              </Show>
              <Show when={groupType() === "BY_PROJECT_MILESTONE"}>
                <div class="flex gap-1">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      const [projectId, milestoneId] = group.key.split("::");
                      if (milestoneId !== "_")
                        pushPanel({
                          type: "MILESTONE",
                          milestoneId: milestoneId,
                        });
                      else
                        pushPanel({
                          type: "PROJECT_DETAILS",
                          projectId: projectId,
                        });
                    }}
                  >
                    詳細
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={async () => {
                      const [projectId, milestoneId] = group.key.split("::");
                      const taskId = ulid();
                      await client.api.tasks.post({
                        id: taskId,
                        projectId: projectId,
                        milestoneId: milestoneId === "_" ? null : milestoneId,
                        name: "新工作",
                        description: "",
                        isDone: false,
                        labelIds: [],
                        isArchived: false,
                        dueDate: null,
                        assigneeIds: [],
                      });
                      pushPanel({ type: "TASK", taskId });
                    }}
                  >
                    ＋ 新增工作
                  </Button>
                </div>
              </Show>
            </div>
            <div class="space-y-1 pl-2">
              <For each={tasks}>
                {(t) => (
                  <TaskBlock
                    task={t}
                    showProject={groupType() === "BY_DUE_DATE"}
                    showMilestone={
                      groupType() === "BY_DUE_DATE" ||
                      groupType() === "BY_PROJECT"
                    }
                  />
                )}
              </For>
            </div>
          </div>
        )}
      </PanelList>
    </Panel>
  );
}
