import { useFilterStore } from "@frontend/stores/filterStore";
import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { useProjectStore } from "@frontend/stores/projectStore";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type FilterPanelProps = {
  onClose: () => void;
};

export default function FilterPanel(props: FilterPanelProps) {
  const { labels } = useLabelStore();

  const projects = () => useProjectStore().projects();

  function setHasLabel(labelId: string, has: boolean) {
    const currentLabelIds = useFilterStore().filter().labelIds ?? [];
    useFilterStore().setFilter({
      ...useFilterStore().filter(),
      labelIds: has
        ? [...currentLabelIds, labelId]
        : currentLabelIds.filter((id) => id !== labelId),
    });
  }

  function setHasProject(projectId: string, has: boolean) {
    const currentProjectIds = useFilterStore().filter().projectIds ?? [];
    useFilterStore().setFilter({
      ...useFilterStore().filter(),
      projectIds: has
        ? [...currentProjectIds, projectId]
        : currentProjectIds.filter((id) => id !== projectId),
    });
  }

  function clearFilter() {
    useFilterStore().setFilter({
      ...useFilterStore().filter(),
      projectIds: undefined,
      includeDoneTasks: true,
      labelIds: undefined,
    });
  }
  return (
    <DetailPanel title="篩選" onClose={props.onClose}>
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label class="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useFilterStore().filter().includeDoneTasks}
              onInput={(e) =>
                useFilterStore().setIncludeDoneTasks(e.currentTarget.checked)
              }
            />
            <span>已完成</span>
          </label>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">所屬專案</label>
          <div class="flex flex-wrap gap-2">
            {projects().map((project) => (
              <label class="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    useFilterStore()
                      .filter()
                      .projectIds?.includes(project.id) ?? false
                  }
                  onChange={(e) =>
                    setHasProject(project.id, e.currentTarget.checked)
                  }
                />
                {project.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">標籤</label>
          <div class="flex flex-wrap gap-2">
            {labels().map((label) => (
              <label class="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    useFilterStore().filter().labelIds?.includes(label.id) ??
                    false
                  }
                  onChange={(e) =>
                    setHasLabel(label.id, e.currentTarget.checked)
                  }
                />
                <span
                  class="px-2 py-1 rounded"
                  style={{
                    "background-color": label.color,
                    color: getLabelTextColor(label.color),
                  }}
                >
                  {label.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Button onclick={clearFilter}>清除篩選</Button>
      </div>
    </DetailPanel>
  );
}
