import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import { baseInputClass } from "@frontend/components/Input";
import Panel, {
  PanelList,
  PanelSections,
  SectionLabel,
} from "@frontend/components/Panel";
import { TaskBlock } from "@frontend/components/TaskBlock";
import { baseTextareaClass } from "@frontend/components/Textarea";
import { usePanelController } from "@frontend/stores/PanelController";
import { useFilterStore } from "@frontend/stores/filterStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { format, parse } from "date-fns";
import { debounce } from "lodash";
import { createMemo, onMount } from "solid-js";
import { ulid } from "ulid";

import type { Milestone } from "@backend/schemas/Milestone";

export type MilestoneDetailsPanelProps = {
  milestoneId: string;
};

export default function MilestoneDetailsPanel(
  props: MilestoneDetailsPanelProps
) {
  const { popPanel, pushPanel } = usePanelController();
  const { getMilestone } = useMilestoneStore();
  const milestone = createMemo(() => getMilestone(props.milestoneId));
  const project = () =>
    useProjectStore().getProject(milestone()?.projectId ?? "");
  let nameInputRef: HTMLInputElement | undefined;
  onMount(() => {
    nameInputRef?.focus();
  });

  const { setMilestoneIds } = useFilterStore();
  function applyFilter() {
    setMilestoneIds([props.milestoneId]);
    pushPanel({ type: "Filter" });
  }

  const removeMilestone = async () => {
    await client.api.milestones({ id: props.milestoneId }).delete();
    popPanel();
  };

  function handleUpdateMilestone(update: Partial<Milestone>) {
    client.api.milestones({ id: props.milestoneId }).patch(update);
  }

  const debouncedHandleUpdateMilestone = debounce(handleUpdateMilestone, 300);

  const { tasksWithRelation } = useTaskStore();
  const tasks = createMemo(() =>
    tasksWithRelation().filter(
      (task) => task.milestoneId === props.milestoneId && !task.isArchived
    )
  );

  async function createTask() {
    const taskId = ulid();
    await client.api.tasks.post({
      id: taskId,
      projectId: milestone()?.projectId || "",
      milestoneId: props.milestoneId,
      name: "新工作",
      description: "",
      dueDate: null,
      isDone: false,
      isArchived: false,
      labelIds: [],
      assigneeIds: [],
    });
    pushPanel({ type: "Task", taskId });
  }

  return (
    <Panel
      title={`里程碑詳情 - ${milestone()?.name || ""}`}
      actions={
        <Button variant="secondary" size="small" onClick={applyFilter}>
          套用篩選
        </Button>
      }
    >
      <PanelSections>
        <SectionLabel>所屬專案</SectionLabel>
        <div class="w-full flex">
          <input
            class={`${baseInputClass} flex-1`}
            value={project()?.name || ""}
            disabled
          />
          <Button
            variant="secondary"
            size="small"
            class="ml-2"
            onclick={() =>
              pushPanel({
                type: "ProjectDetails",
                projectId: milestone()!.projectId,
              })
            }
          >
            詳細
          </Button>
        </div>

        <SectionLabel>名稱</SectionLabel>
        <input
          class={baseInputClass}
          ref={nameInputRef}
          value={milestone()?.name}
          onInput={(e) =>
            debouncedHandleUpdateMilestone({ name: e.currentTarget.value })
          }
        />
        <SectionLabel>到期日</SectionLabel>
        <input
          class={baseInputClass}
          type="date"
          value={
            milestone()?.dueDate
              ? format(milestone()!.dueDate!, "yyyy-MM-dd")
              : ""
          }
          onInput={(e) => {
            const value = e.currentTarget.value;
            handleUpdateMilestone({
              dueDate: value ? parse(value, "yyyy-MM-dd", new Date()) : null,
            });
          }}
          placeholder="到期日 (可選)"
        />
        <SectionLabel>描述</SectionLabel>
        <textarea
          class={baseTextareaClass}
          value={milestone()?.description}
          onInput={(e) =>
            debouncedHandleUpdateMilestone({
              description: e.currentTarget.value,
            })
          }
        />
        <SectionLabel>未封存工作</SectionLabel>
        <PanelList items={tasks}>
          {(task) => (
            <TaskBlock class="w-full" task={task} showProject={false} />
          )}
        </PanelList>
        <div>
          <Button variant="secondary" onClick={createTask}>
            新增工作
          </Button>
        </div>
        <SectionLabel>進階操作</SectionLabel>
        <div class="flex gap-2">
          <Button variant="danger" onclick={removeMilestone}>
            刪除
          </Button>
        </div>
      </PanelSections>
    </Panel>
  );
}
