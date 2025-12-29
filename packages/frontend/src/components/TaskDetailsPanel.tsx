import { client } from "@frontend/client";
import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { format } from "date-fns";
import { For, Show, onMount } from "solid-js";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type TaskDetailsPanelProps = {
  taskId: string;
  onClose: () => void;
};

export default function TaskDetailsPanel(props: TaskDetailsPanelProps) {
  const task = () => useTaskStore().getTask(props.taskId);
  const { labels } = useLabelStore();
  const { persons } = usePersonStore();
  let nameInputRef: HTMLInputElement | undefined;

  onMount(() => {
    nameInputRef?.focus();
  });

  const removeTask = async () => {
    await client.api.tasks({ id: props.taskId! }).delete();
    props.onClose();
  };

  const setTaskIsArchived = async (isArchived: boolean) => {
    await client.api.tasks({ id: props.taskId! }).patch({
      isArchived,
    });
  };

  function handleUpdateProjectId(projectId: string) {
    client.api.tasks({ id: props.taskId! }).patch({
      projectId,
    });
  }

  function handleUpdateName(name: string) {
    client.api.tasks({ id: props.taskId! }).patch({
      name,
    });
  }

  function handleUpdateDescription(description: string) {
    client.api.tasks({ id: props.taskId! }).patch({
      description,
    });
  }

  function handleUpdateDueDate(dueDate: string) {
    client.api.tasks({ id: props.taskId! }).patch({
      dueDate: dueDate ? new Date(dueDate) : null,
    });
  }

  function handleUpdateIsDone(isDone: boolean) {
    client.api.tasks({ id: props.taskId! }).patch({
      isDone,
    });
  }

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
    <DetailPanel title="編輯工作項目" onClose={props.onClose}>
      <div class="flex flex-col gap-4 p-2">
        <div>
          <label class="block text-sm font-medium mb-1">所屬專案</label>
          <select
            class="border w-full px-2 py-1 rounded"
            value={task()?.projectId}
            onInput={(e) => handleUpdateProjectId(e.currentTarget.value)}
          >
            <For each={useProjectStore().filteredProjects()}>
              {(p) => <option value={p.id}>{p.name}</option>}
            </For>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">名稱</label>
          <input
            ref={nameInputRef}
            class="border w-full px-2 py-1 rounded"
            value={task()?.name}
            onInput={(e) => handleUpdateName(e.currentTarget.value)}
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">描述</label>
          <textarea
            class="border w-full px-2 py-1 rounded h-32"
            value={task()?.description}
            onInput={(e) => handleUpdateDescription(e.currentTarget.value)}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">到期日</label>
          <input
            class="border w-full px-2 py-1 rounded"
            type="date"
            value={
              task()?.dueDate ? format(task()!.dueDate!, "yyyy-MM-dd") : ""
            }
            onInput={(e) => handleUpdateDueDate(e.currentTarget.value)}
          />
        </div>

        <div>
          <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={task()?.isDone}
              onChange={(e) => handleUpdateIsDone(e.currentTarget.checked)}
            />
            <span>已完成</span>
          </label>
        </div>
        <div class="flex flex-col gap-2">
          <label class="block text-sm font-medium mb-1">指派</label>
          <div class="flex flex-wrap gap-2">
            {persons().map((person) => (
              <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={task()?.assigneeIds?.includes(person.id)}
                  onChange={(e) =>
                    setHasAssignee(person.id, e.currentTarget.checked)
                  }
                />
                {person.name}
              </label>
            ))}
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="block text-sm font-medium mb-1">標籤</label>
          <div class="flex flex-wrap gap-2">
            {labels().map((label) => (
              <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={task()?.labelIds?.includes(label.id)}
                  onChange={(e) =>
                    setHasLabel(label.id, e.currentTarget.checked)
                  }
                />
                <span
                  class="px-2 py-1 rounded"
                  style={{
                    "background-color": label.color,
                    color: getLabelTextColor(label.color),
                  }}
                >
                  {label.name}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            onclick={() => setTaskIsArchived(!task()?.isArchived)}
          >
            {task()?.isArchived ? "還原" : "封存"}
          </Button>
          <Show when={task()?.isArchived}>
            <Button variant="danger" onclick={removeTask}>
              刪除
            </Button>
          </Show>
        </div>
      </div>
    </DetailPanel>
  );
}
