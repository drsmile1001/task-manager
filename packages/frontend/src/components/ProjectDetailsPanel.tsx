import { client } from "@frontend/client";
import { projectStore } from "@frontend/stores/projectStore";
import { Show, createEffect, createSignal } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type ProjectDetailsPanelProps = {
  projectId: string | null;
  onClose: () => void;
};

export default function ProjectDetailsPanel(props: ProjectDetailsPanelProps) {
  const isEditing = () => props.projectId !== null;
  const isCreating = () => props.projectId === null;

  const project = () =>
    props.projectId ? projectStore.getProject(props.projectId) : null;

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
    <DetailPanel
      title={isCreating() ? "新增專案" : "編輯專案"}
      onClose={props.onClose}
    >
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
          <Button variant="danger" onClick={removeProject}>
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
