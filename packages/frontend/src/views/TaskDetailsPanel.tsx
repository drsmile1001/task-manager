import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Checkbox from "@frontend/components/Checkbox";
import { baseInputClass } from "@frontend/components/Input";
import Panel, { PanelSections, SectionLabel } from "@frontend/components/Panel";
import { usePanelController } from "@frontend/stores/PanelController";
import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { format, isValid } from "date-fns";
import { debounce } from "lodash";
import { For, Show, createMemo, onMount } from "solid-js";

import type { Task } from "@backend/schemas/Task";

export type TaskDetailsPanelProps = {
  taskId: string;
};

export default function TaskDetailsPanel(props: TaskDetailsPanelProps) {
  const { popPanel, pushPanel } = usePanelController();
  const { getTask } = useTaskStore();
  const task = () => getTask(props.taskId!);
  const { nonArchivedProjects } = useProjectStore();
  const { getMilestonesByProjectId } = useMilestoneStore();
  const availableMilestones = createMemo(() => {
    const projectId = task()?.projectId;
    if (!projectId) return [];
    return getMilestonesByProjectId(projectId);
  });
  const { labels } = useLabelStore();
  const { persons } = usePersonStore();
  let nameInputRef: HTMLInputElement | undefined;

  onMount(() => {
    nameInputRef?.focus();
  });

  const removeTask = async () => {
    await client.api.tasks({ id: props.taskId! }).delete();
    popPanel();
  };

  function handleUpdateTask(update: Partial<Task>) {
    console.log("updating task", update);
    client.api.tasks({ id: props.taskId! }).patch(update);
  }

  const debouncedHandleUpdateTask = debounce(handleUpdateTask, 300);

  function setHasLabel(labelId: string, hasLabel: boolean) {
    const currentLabelIds = task()?.labelIds || [];
    let newLabelIds: string[];
    if (hasLabel) {
      newLabelIds = [...currentLabelIds, labelId];
    } else {
      newLabelIds = currentLabelIds.filter((id) => id !== labelId);
    }
    client.api.tasks({ id: props.taskId! }).patch({
      labelIds: newLabelIds,
    });
  }

  function setHasAssignee(personId: string, hasAssignee: boolean) {
    const currentAssigneeIds = task()?.assigneeIds || [];
    let newAssigneeIds: string[];
    if (hasAssignee) {
      newAssigneeIds = [...currentAssigneeIds, personId];
    } else {
      newAssigneeIds = currentAssigneeIds.filter((id) => id !== personId);
    }
    client.api.tasks({ id: props.taskId! }).patch({
      assigneeIds: newAssigneeIds,
    });
  }

  return (
    <Panel title={`工作詳情 - ${task()?.name || ""}`}>
      <PanelSections>
        <SectionLabel>所屬專案</SectionLabel>
        <div class="w-full flex">
          <select
            class="flex-1 border px-2 py-1 rounded"
            value={task()?.projectId}
            onInput={(e) =>
              handleUpdateTask({
                projectId: e.currentTarget.value,
              })
            }
          >
            <For each={nonArchivedProjects()}>
              {(p) => <option value={p.id}>{p.name}</option>}
            </For>
          </select>
          <Button
            variant="secondary"
            size="small"
            class="ml-2"
            onclick={() =>
              pushPanel({
                type: "ProjectDetails",
                projectId: task()!.projectId,
              })
            }
          >
            詳細
          </Button>
        </div>

        <SectionLabel>所屬里程碑</SectionLabel>
        <div class="w-full flex items-center">
          <select
            class="flex-1 border px-2 py-1 rounded"
            value={task()?.milestoneId || ""}
            onInput={(e) =>
              handleUpdateTask({ milestoneId: e.currentTarget.value || null })
            }
          >
            <option value="">{"<無里程碑>"}</option>
            <For each={availableMilestones()}>
              {(p) => <option value={p.id}>{p.name}</option>}
            </For>
          </select>
          <Show when={task()?.milestoneId}>
            <Button
              variant="secondary"
              size="small"
              class="ml-2"
              onclick={() =>
                pushPanel({
                  type: "Milestone",
                  milestoneId: task()!.milestoneId!,
                })
              }
            >
              詳細
            </Button>
          </Show>
        </div>

        <SectionLabel>名稱</SectionLabel>
        <input
          class={baseInputClass}
          ref={nameInputRef}
          value={task?.name}
          onInput={(e) =>
            debouncedHandleUpdateTask({ name: e.currentTarget.value })
          }
        />

        <SectionLabel>描述</SectionLabel>
        <textarea
          class={`${baseInputClass} h-32`}
          value={task()?.description}
          onInput={(e) =>
            debouncedHandleUpdateTask({ description: e.currentTarget.value })
          }
        />

        <SectionLabel>到期日</SectionLabel>
        <input
          class={baseInputClass}
          type="date"
          value={task()?.dueDate ? format(task()!.dueDate!, "yyyy-MM-dd") : ""}
          onInput={(e) => {
            const date = new Date(e.currentTarget.value);
            handleUpdateTask({ dueDate: isValid(date) ? date : null });
          }}
        />

        <SectionLabel>已完成</SectionLabel>
        <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={task()?.isDone}
            onChange={(e) =>
              handleUpdateTask({ isDone: e.currentTarget.checked })
            }
          />
          <span>已完成</span>
        </label>

        <SectionLabel>指派</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {persons().map((person) => (
            <Checkbox
              title={person.name}
              checked={task()?.assigneeIds?.includes(person.id) ?? false}
              onChange={(e) =>
                setHasAssignee(person.id, e.currentTarget.checked)
              }
            />
          ))}
        </div>

        <SectionLabel>標籤</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {labels().map((label) => (
            <Checkbox
              checked={task()?.labelIds?.includes(label.id) ?? false}
              onChange={(e) => setHasLabel(label.id, e.currentTarget.checked)}
            >
              <span
                class="px-1 py-0.5 rounded"
                style={{
                  "background-color": label.color,
                  color: getLabelTextColor(label.color),
                }}
              >
                {label.name}
              </span>
            </Checkbox>
          ))}
        </div>

        <SectionLabel>進階操作</SectionLabel>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            onclick={() =>
              handleUpdateTask({ isArchived: !task()?.isArchived })
            }
          >
            {task()?.isArchived ? "還原" : "封存"}
          </Button>
          <Show when={task()?.isArchived}>
            <Button variant="danger" onclick={removeTask}>
              刪除
            </Button>
          </Show>
        </div>
      </PanelSections>
    </Panel>
  );
}
