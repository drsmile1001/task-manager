import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Checkbox from "@frontend/components/Checkbox";
import Input from "@frontend/components/Input";
import Panel, { PanelSections, SectionLabel } from "@frontend/components/Panel";
import { Textarea } from "@frontend/components/Textarea";
import { usePanelController } from "@frontend/stores/detailPanelController";
import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { format } from "date-fns";
import { For, Show, onMount } from "solid-js";

export type TaskDetailsPanelProps = {
  taskId: string;
};

export default function TaskDetailsPanel(props: TaskDetailsPanelProps) {
  const { popPanel, pushPanel } = usePanelController();
  const task = () => useTaskStore().getTask(props.taskId);
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
    <Panel title={`工作詳情 - ${task()?.name || ""}`}>
      <PanelSections>
        <SectionLabel>所屬專案</SectionLabel>
        <div class="w-full flex items-center">
          <select
            class="flex-1 border px-2 py-1 rounded"
            value={task()?.projectId}
            onInput={(e) => handleUpdateProjectId(e.currentTarget.value)}
          >
            <For each={useProjectStore().filteredProjects()}>
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

        <SectionLabel>名稱</SectionLabel>
        <Input
          ref={nameInputRef}
          value={task()?.name}
          onInput={(e) => handleUpdateName(e.currentTarget.value)}
        />

        <SectionLabel>描述</SectionLabel>
        <Textarea
          class="h-32"
          value={task()?.description}
          onInput={(e) => handleUpdateDescription(e.currentTarget.value)}
        />

        <SectionLabel>到期日</SectionLabel>
        <Input
          type="date"
          value={task()?.dueDate ? format(task()!.dueDate!, "yyyy-MM-dd") : ""}
          onInput={(e) => handleUpdateDueDate(e.currentTarget.value)}
        />

        <SectionLabel>已完成</SectionLabel>
        <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={task()?.isDone}
            onChange={(e) => handleUpdateIsDone(e.currentTarget.checked)}
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
      </PanelSections>
    </Panel>
  );
}
