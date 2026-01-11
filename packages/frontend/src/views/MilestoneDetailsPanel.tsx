import { client } from "@frontend/client";
import { AuditLogBlock } from "@frontend/components/AuditLogBlock";
import Button from "@frontend/components/Button";
import { Input, baseInputClass } from "@frontend/components/Input";
import { MarkdownTextarea } from "@frontend/components/MarkdownTextarea";
import Panel, {
  PanelList,
  PanelSections,
  SectionLabel,
} from "@frontend/components/Panel";
import { TaskBlock } from "@frontend/components/TaskBlock";
import { useDragController } from "@frontend/stores/DragController";
import { usePanelController } from "@frontend/stores/PanelController";
import { useSharedFilterStore } from "@frontend/stores/SharedFilterStore";
import { useAuditLogStore } from "@frontend/stores/auditLogStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { Show, createMemo, onMount } from "solid-js";
import { ulid } from "ulid";

import type { Milestone } from "@backend/schemas/Milestone";
import type { Task } from "@backend/schemas/Task";

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
  const { setDragContext } = useDragController();
  const { logs } = useAuditLogStore();

  let nameInputRef: HTMLInputElement | undefined;
  onMount(() => {
    nameInputRef?.focus();
  });

  const { setSharedFilter } = useSharedFilterStore();
  function applyFilter() {
    setSharedFilter({
      milestoneIds: [props.milestoneId],
    });
    pushPanel({ type: "SHARED_FILTER" });
  }

  const removeMilestone = async () => {
    await client.api.milestones({ id: props.milestoneId }).delete();
    popPanel();
  };

  function handleUpdateMilestone(update: Partial<Milestone>) {
    client.api.milestones({ id: props.milestoneId }).patch(update);
  }

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
      dueDate: milestone()?.dueDate || null,
      isDone: false,
      isArchived: false,
      labelIds: [],
      assigneeIds: [],
    });
    pushPanel({ type: "TASK", taskId });
  }

  function relatedAuditLogs() {
    return logs.filter((log) => {
      if (log.entityType === "MILESTONE" && log.entityId === props.milestoneId)
        return true;
      if (log.entityType === "TASK") {
        const after = log.changes.after as Task | undefined;
        const before = log.changes.before as Task | undefined;
        if (
          after?.milestoneId === props.milestoneId ||
          before?.milestoneId === props.milestoneId
        )
          return true;
      }

      return false;
    });
  }

  return (
    <Panel
      title={`里程碑詳情 - ${milestone()?.name || ""}`}
      actions={
        <div class="flex items-center justify-between">
          <Button variant="secondary" size="small" onClick={applyFilter}>
            套用篩選
          </Button>
          <div
            class="bg-blue-50 border border-blue-300 text-xs shadow p-1 rounded mb-1 cursor-pointer hover:bg-blue-100 select-none"
            draggable="true"
            onDragStart={() => {
              setDragContext({
                type: "MILESTONE",
                milestoneId: props.milestoneId,
              });
            }}
          >
            指派
          </div>
        </div>
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
                type: "PROJECT_DETAILS",
                projectId: milestone()!.projectId,
              })
            }
          >
            詳細
          </Button>
        </div>

        <SectionLabel>名稱</SectionLabel>
        <Input
          ref={nameInputRef}
          value={milestone()?.name}
          onConfirm={(value) =>
            handleUpdateMilestone({
              name: value,
            })
          }
        />
        <SectionLabel>到期日</SectionLabel>
        <input
          class={baseInputClass}
          type="date"
          value={milestone()?.dueDate ?? ""}
          onInput={(e) => {
            const value = e.currentTarget.value;
            handleUpdateMilestone({
              dueDate: value ? value : null,
            });
          }}
          placeholder="到期日 (可選)"
        />
        <SectionLabel>描述</SectionLabel>
        <MarkdownTextarea
          value={milestone()?.description}
          updateValue={(value) =>
            handleUpdateMilestone({
              description: value,
            })
          }
        />
        <SectionLabel>工作</SectionLabel>
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

        <SectionLabel>操作記錄</SectionLabel>
        <PanelList items={relatedAuditLogs}>
          {(log) => <AuditLogBlock log={log} />}
        </PanelList>

        <SectionLabel>進階操作</SectionLabel>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            onclick={() =>
              handleUpdateMilestone({ isArchived: !milestone()?.isArchived })
            }
          >
            {milestone()?.isArchived ? "還原" : "封存"}
          </Button>
          <Show when={milestone()?.isArchived}>
            <Button variant="danger" onclick={removeMilestone}>
              刪除
            </Button>
          </Show>
        </div>
      </PanelSections>
    </Panel>
  );
}
