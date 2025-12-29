import { client } from "@frontend/client";
import { useProjectStore } from "@frontend/stores/projectStore";
import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type ProjectPanelProps = {
  onClose: () => void;
};

export default function ProjectPanel(props: ProjectPanelProps) {
  const [showArchived, setShowArchived] = createSignal(false);
  const projects = createMemo(() =>
    useProjectStore()
      .projects()
      .filter((p) => (showArchived() ? true : !p.isArchived))
  );
  const nameInputRefs = new Map<string, HTMLInputElement>();
  let toFocusProjectId: string | null = null;

  async function createProject() {
    const projectId = ulid();
    toFocusProjectId = projectId;
    await client.api.projects.post({
      id: projectId,
      name: "新專案",
      description: "",
      order: null,
      isArchived: false,
      startedAt: null,
      endedAt: null,
    });
  }

  createEffect(() => {
    projects();
    if (toFocusProjectId) {
      const inputRef = nameInputRefs.get(toFocusProjectId);
      if (inputRef) {
        inputRef.focus();
        toFocusProjectId = null;
      }
    }
  });

  function setProjectName(projectId: string, name: string) {
    client.api.projects({ id: projectId }).patch({
      name,
    });
  }

  function setProjectOrder(projectId: string, order: string) {
    const orderNumber = order ? parseInt(order) : null;
    client.api.projects({ id: projectId }).patch({
      order: orderNumber,
    });
  }

  function setProjectDescription(projectId: string, description: string) {
    client.api.projects({ id: projectId }).patch({
      description,
    });
  }

  function handleSetProjectIsArchived(projectId: string, b: boolean) {
    client.api.projects({ id: projectId }).patch({
      isArchived: b,
    });
  }

  function handleDeleteProject(projectId: string) {
    client.api.projects({ id: projectId }).delete();
  }

  return (
    <DetailPanel title="專案" onClose={props.onClose}>
      <div class="p-2 flex flex-col gap-4">
        {projects().map((project) => (
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <input
                ref={(el) => nameInputRefs.set(project.id, el)}
                class="border px-2 py-1 w-40 rounded"
                value={project.name}
                onBlur={(e) =>
                  setProjectName(project.id, e.currentTarget.value)
                }
                placeholder="專案名稱"
              />
              <input
                class="border px-2 py-1 w-30 rounded"
                type="number"
                min="1"
                value={project.order ?? ""}
                onInput={(e) =>
                  setProjectOrder(project.id, e.currentTarget.value)
                }
                placeholder="排序 (可選)"
              />
              <Button
                variant="secondary"
                size="small"
                onClick={() =>
                  handleSetProjectIsArchived(project.id, !project.isArchived)
                }
              >
                {project.isArchived ? "復原" : "封存"}
              </Button>
              <Show when={project.isArchived}>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  刪除
                </Button>
              </Show>
            </div>
            <textarea
              class="border px-2 py-1 w-full rounded resize-none"
              value={project.description}
              onBlur={(e) =>
                setProjectDescription(project.id, e.currentTarget.value)
              }
              placeholder="專案描述"
              rows={2}
            />
          </div>
        ))}
        <div class="flex items-center gap-2">
          <Button variant="secondary" onclick={createProject}>
            新增
          </Button>
          <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived()}
              onInput={(e) => setShowArchived(e.currentTarget.checked)}
            />
            <span>已封存專案</span>
          </label>
        </div>
      </div>
    </DetailPanel>
  );
}
