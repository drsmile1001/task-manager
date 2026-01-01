import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import { checkboxLabelClass } from "@frontend/components/Checkbox";
import { baseInputClass } from "@frontend/components/Input";
import Panel, { PanelList } from "@frontend/components/Panel";
import { usePanelController } from "@frontend/stores/PanelController";
import { useProjectStore } from "@frontend/stores/projectStore";
import { debounce } from "lodash";
import { createEffect, createMemo, createSignal } from "solid-js";
import { ulid } from "ulid";

import type { Project } from "@backend/schemas/Project";

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

  function handleUpdateProject(projectId: string, update: Partial<Project>) {
    client.api.projects({ id: projectId }).patch(update);
  }

  const debouncedHandleUpdateProject = debounce(handleUpdateProject, 300);

  return (
    <Panel
      title="專案清單"
      actions={
        <div class="flex items-center justify-between">
          <label class={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={showArchived()}
              onInput={(e) => setShowArchived(e.currentTarget.checked)}
            />
            已封存專案
          </label>
          <Button variant="secondary" size="small" onclick={createProject}>
            + 新增
          </Button>
        </div>
      }
    >
      <PanelList items={projects}>
        {(project) => (
          <>
            <input
              ref={(el) => nameInputRefs.set(project.id, el)}
              class={`${baseInputClass} flex-1`}
              classList={{
                "text-gray-500 italic": project.isArchived,
              }}
              value={project.name}
              onInput={(e) =>
                debouncedHandleUpdateProject(project.id, {
                  name: e.currentTarget.value,
                })
              }
              placeholder="專案名稱"
            />
            <input
              class={`${baseInputClass} w-20`}
              type="number"
              min="1"
              value={project.order ?? ""}
              onInput={(e) => {
                const value = e.currentTarget.value;
                handleUpdateProject(project.id, {
                  order: value ? parseInt(value) : null,
                });
              }}
              placeholder="排序"
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
          </>
        )}
      </PanelList>
    </Panel>
  );
}
