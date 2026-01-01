import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Input from "@frontend/components/Input";
import Panel, {
  PanelList,
  PanelSections,
  SectionLabel,
} from "@frontend/components/Panel";
import { Textarea } from "@frontend/components/Textarea";
import { usePanelController } from "@frontend/stores/detailPanelController";
import { useDragStore } from "@frontend/stores/dragStore";
import { useFilterStore } from "@frontend/stores/filterStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { format, parse } from "date-fns";
import { Show, createEffect, createMemo, onMount } from "solid-js";
import { ulid } from "ulid";

import type { Milestone } from "@backend/schemas/Milestone";
import type { Task } from "@backend/schemas/Task";

export type ProjectDetailsPanelProps = {
  projectId: string;
};

export default function ProjectDetailsPanel(props: ProjectDetailsPanelProps) {
  const { popPanel, pushPanel } = usePanelController();
  const { getProject } = useProjectStore();
  const project = createMemo(() => getProject(props.projectId));

  const { setProjectIds } = useFilterStore();
  function applyFilter() {
    setProjectIds([props.projectId]);
    pushPanel({ type: "Filter" });
  }

  let nameInputRef: HTMLInputElement | undefined;
  onMount(() => {
    nameInputRef?.focus();
  });

  const removeProject = async () => {
    await client.api.projects({ id: props.projectId }).delete();
    popPanel();
  };

  const setProjectIsArchived = async (isArchived: boolean) => {
    await client.api.projects({ id: props.projectId }).patch({
      isArchived,
    });
  };

  function handleUpdateName(name: string) {
    client.api.projects({ id: props.projectId }).patch({
      name,
    });
  }

  function handleUpdateDescription(description: string) {
    client.api.projects({ id: props.projectId }).patch({
      description,
    });
  }

  function handleUpdateOrder(order: string) {
    const orderNumber = order ? parseInt(order) : null;
    client.api.projects({ id: props.projectId }).patch({
      order: orderNumber,
    });
  }

  const { getMilestonesByProjectId } = useMilestoneStore();
  const milestones = () => getMilestonesByProjectId(props.projectId);
  async function handleUpdateMileStone(
    milestoneId: string,
    updating: Partial<Milestone>
  ) {
    await client.api.milestones({ id: milestoneId }).patch(updating);
  }
  const milestoneNameInputRefs = new Map<string, HTMLInputElement>();
  let toFocusMilestoneId: string | null = null;
  async function createMilestone() {
    const milestoneId = ulid();
    toFocusMilestoneId = milestoneId;
    await client.api.milestones.post({
      id: milestoneId,
      projectId: props.projectId,
      name: "新里程碑",
      dueDate: null,
      description: "",
    });
  }
  createEffect(() => {
    milestones();
    if (toFocusMilestoneId) {
      const inputRef = milestoneNameInputRefs.get(toFocusMilestoneId);
      if (inputRef) {
        inputRef.focus();
        toFocusMilestoneId = null;
      }
    }
  });

  const { tasksWithRelation } = useTaskStore();
  const tasks = createMemo(() =>
    tasksWithRelation().filter(
      (task) => task.projectId === props.projectId && !task.isArchived
    )
  );
  function handleUpdateTask(taskId: string, updating: Partial<Task>) {
    client.api.tasks({ id: taskId }).patch(updating);
  }
  async function createTask() {
    const taskId = ulid();
    toFocusTaskId = taskId;
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
  }
  const taskNameInputRefs = new Map<string, HTMLInputElement>();
  let toFocusTaskId: string | null = null;
  createEffect(() => {
    tasks();
    if (toFocusTaskId) {
      const inputRef = taskNameInputRefs.get(toFocusTaskId);
      if (inputRef) {
        inputRef.focus();
        toFocusTaskId = null;
      }
    }
  });

  async function handleTaskDragStart(e: DragEvent, task: Task) {
    const { setDragImage, startTaskDrag } = useDragStore();
    startTaskDrag(task.id);
    await setDragImage(e, () => (
      <span class="rounded bg-gray-200 px-2 py-1 border border-gray-400 shadow-md">
        {task.name}
      </span>
    ));
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
        <Input
          ref={nameInputRef}
          value={project()?.name}
          onBlur={(e) => handleUpdateName(e.currentTarget.value)}
        />
        <SectionLabel>描述</SectionLabel>
        <Textarea
          value={project()?.description}
          onBlur={(e) => handleUpdateDescription(e.currentTarget.value)}
        />
        <SectionLabel>排序</SectionLabel>
        <Input
          type="number"
          min="1"
          value={project()?.order ?? ""}
          onInput={(e) => handleUpdateOrder(e.currentTarget.value)}
          placeholder="排序 (可選)"
        />
        <SectionLabel>里程碑</SectionLabel>
        <PanelList items={milestones}>
          {(milestone) => (
            <>
              <Input
                ref={(el) => milestoneNameInputRefs.set(milestone.id, el)}
                class="flex-1"
                value={milestone.name}
                placeholder="名稱"
                onBlur={(e) =>
                  handleUpdateMileStone(milestone.id, {
                    name: e.currentTarget.value,
                  })
                }
              />
              <Input
                class="w-40"
                type="date"
                value={
                  milestone.dueDate
                    ? format(milestone.dueDate, "yyyy-MM-dd")
                    : ""
                }
                placeholder="截止日期"
                onBlur={(e) =>
                  handleUpdateMileStone(milestone.id, {
                    dueDate: e.currentTarget.value
                      ? parse(e.currentTarget.value, "yyyy-MM-dd", new Date())
                      : null,
                  })
                }
              />
              <Button
                variant="secondary"
                size="small"
                onClick={() =>
                  pushPanel({ type: "Milestone", milestoneId: milestone.id })
                }
              >
                詳細
              </Button>
            </>
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
            <>
              <div
                class="w-2 cursor-grab select-none"
                draggable="true"
                ondragstart={(e) => handleTaskDragStart(e, task)}
              >
                ::
              </div>
              <Input
                ref={(el) => taskNameInputRefs.set(task.id, el)}
                class="flex-1"
                classList={{
                  "line-through": task.isDone,
                }}
                value={task.name}
                placeholder="名稱"
                onBlur={(e) =>
                  handleUpdateTask(task.id, {
                    name: e.currentTarget.value,
                  })
                }
              />
              <Button
                variant="secondary"
                size="small"
                onClick={() => pushPanel({ type: "Task", taskId: task.id })}
              >
                詳細
              </Button>
            </>
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
            onclick={() => setProjectIsArchived(!project()?.isArchived)}
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
