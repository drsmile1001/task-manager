import { client } from "@frontend/client";
import { For, Show, createEffect, createSignal } from "solid-js";
import { ulid } from "ulid";

import type { ProjectStore } from "../stores/projectStore";
import type { TaskStore } from "../stores/taskStore";

export type TaskDetailsPanelProps = {
  taskId: string | null; // 編輯模式：taskId
  projectIdForCreate: string | null; // 新增模式預設所屬 project
  taskStore: TaskStore;
  projectStore: ProjectStore;
  onClose: () => void;
};

export default function TaskDetailsPanel(props: TaskDetailsPanelProps) {
  const isEditing = () => props.taskId !== null;
  const isCreating = () => props.taskId === null;

  // 取得 task，如為新增則為 null
  const task = () =>
    props.taskId ? props.taskStore.getTask(props.taskId) : null;

  // 表單狀態
  const [form, setForm] = createSignal({
    projectId: props.projectIdForCreate ?? task()?.projectId ?? "",
    name: task()?.name ?? "",
    description: task()?.description ?? "",
    isDone: task()?.isDone ?? false,
  });

  // ★ props.taskId 改變時重新填入 form（Solid 必須這樣做）
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

  // ★ commit：由 Panel 內處理 create/update
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
    <div class="w-[420px] h-full border-l bg-white flex flex-col">
      {/* Header */}
      <div class="p-3 border-b flex justify-between items-center bg-gray-50">
        <div class="font-semibold text-gray-700">
          {isCreating() ? "新增工作項目" : "編輯工作項目"}
        </div>
        <button class="text-gray-500" onClick={props.onClose}>
          ✕
        </button>
      </div>

      {/* Body */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 專案下拉選單 */}
        <div>
          <label class="block text-sm font-medium mb-1">所屬專案</label>
          <select
            class="border w-full px-2 py-1 rounded"
            value={form().projectId}
            onInput={(e) => updateField("projectId", e.currentTarget.value)}
          >
            <For each={props.projectStore.projects()}>
              {(p) => <option value={p.id}>{p.name}</option>}
            </For>
          </select>
        </div>

        {/* Name */}
        <div>
          <label class="block text-sm font-medium mb-1">名稱</label>
          <input
            class="border w-full px-2 py-1 rounded"
            value={form().name}
            onInput={(e) => updateField("name", e.currentTarget.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label class="block text-sm font-medium mb-1">描述</label>
          <textarea
            class="border w-full px-2 py-1 rounded h-32"
            value={form().description}
            onInput={(e) => updateField("description", e.currentTarget.value)}
          />
        </div>

        {/* Done checkbox */}
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

      {/* Footer */}
      <div class="p-3 border-t flex justify-end gap-2">
        <Show when={isEditing()}>
          <button
            class="px-3 py-1 bg-red-300 text-white rounded"
            onClick={removeTask}
          >
            刪除
          </button>
        </Show>
        <button class="px-3 py-1 bg-gray-200 rounded" onClick={props.onClose}>
          取消
        </button>
        <button
          class="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={commit}
        >
          儲存
        </button>
      </div>
    </div>
  );
}
