import { useFilterStore } from "@frontend/stores/filterStore";
import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type FilterPanelProps = {
  onClose: () => void;
};

export default function FilterPanel(props: FilterPanelProps) {
  const { labels } = useLabelStore();
  const { persons } = usePersonStore();
  const { projects } = useProjectStore();

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

  function setHasPerson(personId: string, has: boolean) {
    const currentPersonIds = useFilterStore().filter().personIds ?? [];
    useFilterStore().setFilter({
      ...useFilterStore().filter(),
      personIds: has
        ? [...currentPersonIds, personId]
        : currentPersonIds.filter((id) => id !== personId),
    });
  }

  function clearFilter() {
    useFilterStore().setFilter({
      ...useFilterStore().filter(),
      projectIds: undefined,
      includeDoneTasks: true,
      includeArchivedProjects: false,
      includeArchivedTasks: false,
      labelIds: undefined,
      personIds: undefined,
    });
  }
  return (
    <DetailPanel title="篩選" onClose={props.onClose}>
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div class="flex items-center gap-2">
          <label class="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useFilterStore().filter().includeDoneTasks}
              onInput={(e) =>
                useFilterStore().setIncludeDoneTasks(e.currentTarget.checked)
              }
            />
            <span>已完成工作</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useFilterStore().filter().includeArchivedTasks}
              onInput={(e) =>
                useFilterStore().setIncludeArchivedTasks(
                  e.currentTarget.checked
                )
              }
            />
            <span>已封存工作</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useFilterStore().filter().includeArchivedProjects}
              onInput={(e) =>
                useFilterStore().setIncludeArchivedProjects(
                  e.currentTarget.checked
                )
              }
            />
            <span>已封存專案</span>
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
        <div>
          <label class="block text-sm font-medium mb-1">人員</label>
          <div class="flex flex-wrap gap-2">
            {persons().map((person) => (
              <label class="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    useFilterStore().filter().personIds?.includes(person.id) ??
                    false
                  }
                  onChange={(e) =>
                    setHasPerson(person.id, e.currentTarget.checked)
                  }
                />
                {person.name}
              </label>
            ))}
          </div>
        </div>

        <Button onclick={clearFilter}>清除篩選</Button>
      </div>
    </DetailPanel>
  );
}
