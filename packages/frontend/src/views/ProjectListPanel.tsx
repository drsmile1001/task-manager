import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import { checkboxLabelClass } from "@frontend/components/Checkbox";
import Panel, { PanelList } from "@frontend/components/Panel";
import { usePanelController } from "@frontend/stores/PanelController";
import { useProjectStore } from "@frontend/stores/projectStore";
import { createMemo, createSignal } from "solid-js";
import { ulid } from "ulid";

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

  async function createProject() {
    const projectId = ulid();
    await client.api.projects.post({
      id: projectId,
      name: "新專案",
      code: "",
      description: "",
      order: null,
      isArchived: false,
    });
    pushPanel({ type: "PROJECT_DETAILS", projectId });
  }

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
          <div
            class="w-full p-1 border rounded text-sm shadow cursor-pointer select-none bg-blue-50 border-blue-400 hover:bg-blue-100"
            onClick={() =>
              pushPanel({ type: "PROJECT_DETAILS", projectId: project.id })
            }
          >
            <span class={project.isArchived ? "text-gray-500 italic" : ""}>
              {project.name}
            </span>
          </div>
        )}
      </PanelList>
    </Panel>
  );
}
