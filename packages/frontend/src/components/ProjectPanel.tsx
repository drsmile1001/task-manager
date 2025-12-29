import { client } from "@frontend/client";
import { useProjectStore } from "@frontend/stores/projectStore";
import { format } from "date-fns";
import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type ProjectPanelProps = {
  onClose: () => void;
};

export default function ProjectPanel(props: ProjectPanelProps) {
  const [showArchived, setShowArchived] = createSignal(false);
  const [sortMethod, setSortMethod] = createSignal<
    "order" | "startedAt" | "endedAt"
  >("order");
  const projects = createMemo(() =>
    useProjectStore()
      .projects()
      .filter((p) => (showArchived() ? true : !p.isArchived))
      .sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (sortMethod() === "order") {
          return orderA - orderB;
        } else if (sortMethod() === "startedAt") {
          const dateA = a.startedAt
            ? a.startedAt.getTime()
            : Number.MAX_SAFE_INTEGER;
          const dateB = b.startedAt
            ? b.startedAt.getTime()
            : Number.MAX_SAFE_INTEGER;
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          return orderA - orderB;
        } else if (sortMethod() === "endedAt") {
          const dateA = a.endedAt
            ? a.endedAt.getTime()
            : Number.MAX_SAFE_INTEGER;
          const dateB = b.endedAt
            ? b.endedAt.getTime()
            : Number.MAX_SAFE_INTEGER;
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          return orderA - orderB;
        }
        return 0;
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

  function handleSetProjectStartedAt(projectId: string, dateStr: string) {
    const date = dateStr ? new Date(dateStr) : null;
    client.api.projects({ id: projectId }).patch({
      startedAt: date,
    });
  }

  function handleSetProjectEndedAt(projectId: string, dateStr: string) {
    const date = dateStr ? new Date(dateStr) : null;
    client.api.projects({ id: projectId }).patch({
      endedAt: date,
    });
  }

  function handleDeleteProject(projectId: string) {
    client.api.projects({ id: projectId }).delete();
  }

  return (
    <DetailPanel title="專案" onClose={props.onClose}>
      <div class="h-full flex flex-col">
        <div class="flex-none p-2 flex items-center gap-2 border-b">
          <span>排序</span>
          <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="sort"
              value="order"
              checked={sortMethod() === "order"}
              onInput={(e) => setSortMethod(e.currentTarget.value as any)}
            />
            <span>排序鍵</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="sort"
              value="startedAt"
              checked={sortMethod() === "startedAt"}
              onInput={(e) => setSortMethod(e.currentTarget.value as any)}
            />
            <span>依開始</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="sort"
              value="endedAt"
              checked={sortMethod() === "endedAt"}
              onInput={(e) => setSortMethod(e.currentTarget.value as any)}
            />
            <span>依結束</span>
          </label>
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
              <div class="flex items-center gap-2">
                <span>期間:</span>
                <input
                  type="date"
                  class="border px-2 py-1 w-40 rounded"
                  value={
                    project.startedAt
                      ? format(project.startedAt, "yyyy-MM-dd")
                      : ""
                  }
                  onBlur={(e) =>
                    handleSetProjectStartedAt(project.id, e.currentTarget.value)
                  }
                />
                <input
                  type="date"
                  class="border px-2 py-1 w-40 rounded"
                  value={
                    project.endedAt ? format(project.endedAt, "yyyy-MM-dd") : ""
                  }
                  onBlur={(e) =>
                    handleSetProjectEndedAt(project.id, e.currentTarget.value)
                  }
                />
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
        </div>
      </div>
    </DetailPanel>
  );
}
