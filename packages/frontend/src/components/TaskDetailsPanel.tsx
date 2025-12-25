import { client } from "@frontend/client";
import { projectStore } from "@frontend/stores/projectStore";
import { taskStore } from "@frontend/stores/taskStore";
import { For, Show, createEffect, createSignal } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type TaskDetailsPanelProps = {
  taskId: string | null;
  projectIdForCreate: string | null;
  onClose: () => void;
};

export default function TaskDetailsPanel(props: TaskDetailsPanelProps) {
  const isEditing = () => props.taskId !== null;
  const isCreating = () => props.taskId === null;

  const task = () => (props.taskId ? taskStore.getTask(props.taskId) : null);

  const [form, setForm] = createSignal({
    projectId: props.projectIdForCreate ?? task()?.projectId ?? "",
    name: task()?.name ?? "",
    description: task()?.description ?? "",
    isDone: task()?.isDone ?? false,
  });

  createEffect(() => {
    const t = task();
    setForm({
      projectId: t?.projectId ?? props.projectIdForCreate ?? "",
      name: t?.name ?? "",
      description: t?.description ?? "",
      isDone: t?.isDone ?? false,
    });
  });

  const updateField = (key: string, value: any) => {
    setForm({ ...form(), [key]: value });
  };

  const commit = async () => {
    const data = form();

    if (isCreating()) {
      await client.api.tasks.post({
        id: ulid(),
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        isDone: data.isDone,
      });
    } else if (isEditing() && props.taskId) {
      await client.api.tasks({ id: props.taskId }).patch({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        isDone: data.isDone,
      });
    }

    props.onClose();
  };

  const removeTask = async () => {
    await client.api.tasks({ id: props.taskId! }).delete();
    props.onClose();
  };

  return (
    <DetailPanel
      title={isCreating() ? "新增工作項目" : "編輯工作項目"}
      onClose={props.onClose}
    >
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">所屬專案</label>
          <select
            class="border w-full px-2 py-1 rounded"
            value={form().projectId}
            onInput={(e) => updateField("projectId", e.currentTarget.value)}
          >
            <For each={projectStore.projects()}>
              {(p) => <option value={p.id}>{p.name}</option>}
            </For>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">名稱</label>
          <input
            class="border w-full px-2 py-1 rounded"
            value={form().name}
            onInput={(e) => updateField("name", e.currentTarget.value)}
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">描述</label>
          <textarea
            class="border w-full px-2 py-1 rounded h-32"
            value={form().description}
            onInput={(e) => updateField("description", e.currentTarget.value)}
          />
        </div>

        <div>
          <label class="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form().isDone}
              onChange={(e) => updateField("isDone", e.currentTarget.checked)}
            />
            <span>已完成</span>
          </label>
        </div>
      </div>

      <div class="p-3 border-t flex justify-end gap-2">
        <Show when={isEditing()}>
          <Button variant="danger" onClick={removeTask}>
            刪除
          </Button>
        </Show>
        <Button variant="secondary" onClick={props.onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={commit}>
          儲存
        </Button>
      </div>
    </DetailPanel>
  );
}
