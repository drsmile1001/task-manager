import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import { baseInputClass } from "@frontend/components/Input";
import { MilestoneBlock } from "@frontend/components/MilestoneBlock";
import Panel, {
  PanelList,
  PanelSections,
  SectionLabel,
} from "@frontend/components/Panel";
import { TaskBlock } from "@frontend/components/TaskBlock";
import { baseTextareaClass } from "@frontend/components/Textarea";
import { usePanelController } from "@frontend/stores/PanelController";
import { useSharedFilterStore } from "@frontend/stores/SharedFilterStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { debounce } from "lodash";
import { Show, createMemo, onMount } from "solid-js";
import { ulid } from "ulid";

import type { Project } from "@backend/schemas/Project";

export type ProjectDetailsPanelProps = {
  projectId: string;
};

export default function ProjectDetailsPanel(props: ProjectDetailsPanelProps) {
  const { popPanel, pushPanel } = usePanelController();
  const { getProject } = useProjectStore();
  const project = createMemo(() => getProject(props.projectId));

  const { setSharedFilter } = useSharedFilterStore();
  function applyFilter() {
    setSharedFilter({
      projectIds: [props.projectId],
    });
    pushPanel({ type: "SHARED_FILTER" });
  }

  let nameInputRef: HTMLInputElement | undefined;
  onMount(() => {
    nameInputRef?.focus();
  });

  const removeProject = async () => {
    await client.api.projects({ id: props.projectId }).delete();
    popPanel();
  };

  function handleUpdateProject(update: Partial<Project>) {
    client.api.projects({ id: props.projectId }).patch(update);
  }

  const debouncedHandleUpdateProject = debounce(handleUpdateProject, 1500);

  const { getMilestonesByProjectId } = useMilestoneStore();
  const milestones = () => getMilestonesByProjectId(props.projectId);

  async function createMilestone() {
    const milestoneId = ulid();
    await client.api.milestones.post({
      id: milestoneId,
      projectId: props.projectId,
      name: "新里程碑",
      dueDate: null,
      description: "",
      isArchived: false,
    });
    pushPanel({ type: "MILESTONE", milestoneId });
  }

  const { tasksWithRelation } = useTaskStore();
  const tasks = createMemo(() =>
    tasksWithRelation()
      .filter((task) => task.projectId === props.projectId && !task.isArchived)
      .sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (aDue !== bDue) {
          return aDue - bDue;
        }
        const aPriority = a.priority ?? Infinity;
        const bPriority = b.priority ?? Infinity;
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        const aMilestone = a.milestone ? 0 : 1;
        const bMilestone = b.milestone ? 0 : 1;
        if (aMilestone !== bMilestone) {
          return aMilestone - bMilestone;
        }
        return a.name.localeCompare(b.name);
      })
  );

  async function createTask() {
    const taskId = ulid();
    await client.api.tasks.post({
      id: taskId,
      projectId: props.projectId,
      milestoneId: null,
      name: "新工作",
      description: "",
      dueDate: null,
      isDone: false,
      isArchived: false,
      labelIds: [],
      assigneeIds: [],
    });
    pushPanel({ type: "TASK", taskId });
  }

  return (
    <Panel
      title={`專案詳情 - ${project()?.name || ""}`}
      actions={
        <Button variant="secondary" size="small" onClick={applyFilter}>
          套用篩選
        </Button>
      }
    >
      <PanelSections>
        <SectionLabel>名稱</SectionLabel>
        <input
          class={baseInputClass}
          ref={nameInputRef}
          value={project()?.name}
          onInput={(e) =>
            debouncedHandleUpdateProject({ name: e.currentTarget.value })
          }
        />
        <SectionLabel>描述</SectionLabel>
        <textarea
          class={baseTextareaClass}
          value={project()?.description}
          onInput={(e) =>
            debouncedHandleUpdateProject({ description: e.currentTarget.value })
          }
        />
        <SectionLabel>排序</SectionLabel>
        <input
          class={baseInputClass}
          type="number"
          min="1"
          value={project()?.order ?? ""}
          onInput={(e) => {
            const value = e.currentTarget.value;
            handleUpdateProject({
              order: value === "" ? null : parseInt(value),
            });
          }}
          placeholder="排序 (可選)"
        />
        <SectionLabel>里程碑</SectionLabel>
        <PanelList items={milestones}>
          {(milestone) => (
            <MilestoneBlock class="w-full" milestone={milestone} />
          )}
        </PanelList>
        <div>
          <Button variant="secondary" onClick={createMilestone}>
            新增里程碑
          </Button>
        </div>
        <SectionLabel>未封存工作</SectionLabel>
        <PanelList items={tasks}>
          {(task) => (
            <TaskBlock
              class="w-full"
              task={task}
              showProject={false}
              showMilestone={true}
            />
          )}
        </PanelList>
        <div>
          <Button variant="secondary" onClick={createTask}>
            新增工作
          </Button>
        </div>
        <SectionLabel>進階操作</SectionLabel>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            onclick={() =>
              handleUpdateProject({ isArchived: !project()?.isArchived })
            }
          >
            {project()?.isArchived ? "還原" : "封存"}
          </Button>
          <Show when={project()?.isArchived}>
            <Button variant="danger" onclick={removeProject}>
              刪除
            </Button>
          </Show>
        </div>
      </PanelSections>
    </Panel>
  );
}
