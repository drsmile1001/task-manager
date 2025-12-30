import { client } from "@frontend/client";
import { usePanelController } from "@frontend/stores/detailPanelController";
import { useProjectStore } from "@frontend/stores/projectStore";
import { createEffect, createMemo, createSignal } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export default function ProjectListPanel() {
  const { pushPanel } = usePanelController();
  const [showArchived, setShowArchived] = createSignal(false);
  const projects = createMemo(() =>
    useProjectStore()
      .projects()
      .filter((p) => (showArchived() ? true : !p.isArchived))
      .sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.name.localeCompare(b.name);
      })
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

  return (
    <DetailPanel title="專案清單">
      <div class="h-full flex flex-col">
        <div class="flex-none p-2 flex items-center justify-between border-b">
          <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived()}
              onInput={(e) => setShowArchived(e.currentTarget.checked)}
            />
            <span>已封存專案</span>
          </label>
          <Button variant="secondary" onclick={createProject}>
            新增
          </Button>
        </div>
        <div class="flex-1 p-2 flex flex-col gap-4 overflow-y-auto">
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
                    pushPanel({ type: "ProjectDetails", projectId: project.id })
                  }
                >
                  詳細
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DetailPanel>
  );
}
