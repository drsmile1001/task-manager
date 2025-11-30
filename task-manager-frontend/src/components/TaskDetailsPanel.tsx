import { createEffect, createSignal } from "solid-js";
import type { Task } from "../domain/task";

export default function TaskDetailsPanel(props: {
  task: Task | null | undefined;
  isCreating: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
}) {
  const task = () => props.task;

  const [form, setForm] = createSignal({
    projectId: task()?.projectId ?? "",
    name: task()?.name ?? "",
    description: task()?.description ?? "",
    isDone: task()?.isDone ?? false,
  });

  createEffect(() => {
    const t = task();
    setForm({
      projectId: t?.projectId ?? "",
      name: t?.name ?? "",
      description: t?.description ?? "",
      isDone: t?.isDone ?? false,
    });
  });

  const updateField = (key: string, value: any) => {
    setForm({ ...form(), [key]: value });
  };

  const commit = () => {
    props.onSave(form());
  };

  return (
    <div class="w-[420px] h-full border-l bg-white flex flex-col">
      {/* Header */}
      <div class="p-3 border-b flex justify-between items-center bg-gray-50">
        <div class="font-semibold text-gray-700">
          {props.isCreating ? "新增工作項目" : "編輯工作項目"}
        </div>
        <button class="text-gray-500" onClick={props.onClose}>
          ✕
        </button>
      </div>

      {/* Body */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Project */}
        <div>
          <label class="block text-sm font-medium mb-1">專案</label>
          <input
            class="border w-full px-2 py-1 rounded"
            value={form().projectId}
            onInput={(e) => updateField("projectId", e.currentTarget.value)}
          />
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

        {/* isDone */}
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

      {/* Footer Buttons */}
      <div class="p-3 border-t flex justify-end gap-2">
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
