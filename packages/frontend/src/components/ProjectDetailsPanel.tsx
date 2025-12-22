import { client } from "@frontend/client";
import { Show, createEffect, createSignal } from "solid-js";
import { ulid } from "ulid";

import type { ProjectStore } from "../stores/projectStore";

export type ProjectDetailsPanelProps = {
  projectId: string | null;
  projectStore: ProjectStore;
  onClose: () => void;
};

export default function ProjectDetailsPanel(props: ProjectDetailsPanelProps) {
  const isEditing = () => props.projectId !== null;
  const isCreating = () => props.projectId === null;

  const project = () =>
    props.projectId ? props.projectStore.getProject(props.projectId) : null;

  const [form, setForm] = createSignal({
    name: project()?.name ?? "",
    description: project()?.description ?? "",
  });

  createEffect(() => {
    const p = project();
    setForm({
      name: p?.name ?? "",
      description: p?.description ?? "",
    });
  });

  const update = (k: string, v: any) => setForm({ ...form(), [k]: v });
  const commit = async () => {
    const data = form();

    if (isCreating()) {
      await client.api.projects.post({
        id: ulid(),
        name: data.name,
        description: data.description,
      });
    } else if (isEditing()) {
      await client.api.projects({ id: props.projectId! }).patch({
        name: data.name,
        description: data.description,
      });
    }
    props.onClose();
  };

  const removeProject = async () => {
    await client.api.projects({ id: props.projectId! }).delete();
    props.onClose();
  };

  return (
    <div class="w-[420px] h-full border-l bg-white flex flex-col">
      <div class="p-3 border-b flex justify-between items-center bg-gray-50">
        <div class="font-semibold text-gray-700">
          {isCreating() ? "新增專案" : "編輯專案"}
        </div>
        <button class="text-gray-500" onClick={props.onClose}>
          ✕
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label class="block mb-1 text-sm">專案名稱</label>
          <input
            class="border px-2 py-1 w-full rounded"
            value={form().name}
            onInput={(e) => update("name", e.currentTarget.value)}
          />
        </div>

        <div>
          <label class="block mb-1 text-sm">描述</label>
          <textarea
            class="border px-2 py-1 w-full rounded h-24"
            value={form().description}
            onInput={(e) => update("description", e.currentTarget.value)}
          />
        </div>
      </div>

      <div class="p-3 border-t flex justify-end gap-2">
        <Show when={isEditing()}>
          <button
            class="px-3 py-1 bg-red-300 text-white rounded"
            onClick={removeProject}
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
