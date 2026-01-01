import Button from "@frontend/components/Button";
import Checkbox from "@frontend/components/Checkbox";
import Panel, { PanelSections, SectionLabel } from "@frontend/components/Panel";
import { useFilterStore } from "@frontend/stores/filterStore";
import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";

export default function FilterPanel() {
  const { labels } = useLabelStore();
  const { persons } = usePersonStore();
  const { projects } = useProjectStore();
  const { filter } = useFilterStore();

  function filtedProjects() {
    return projects().filter((project) => {
      if (filter().includeArchivedProjects) {
        return true;
      }
      return !project.isArchived;
    });
  }

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
    <Panel
      title="篩選"
      actions={
        <Button size="small" onclick={clearFilter}>
          清除篩選
        </Button>
      }
    >
      <PanelSections>
        <SectionLabel>狀態篩選</SectionLabel>
        <div class="flex flex-wrap gap-2">
          <Checkbox
            title="已完成工作"
            checked={useFilterStore().filter().includeDoneTasks}
            onInput={(e) =>
              useFilterStore().setIncludeDoneTasks(e.currentTarget.checked)
            }
          />
          <Checkbox
            title="已封存工作"
            checked={useFilterStore().filter().includeArchivedTasks}
            onInput={(e) =>
              useFilterStore().setIncludeArchivedTasks(e.currentTarget.checked)
            }
          />
          <Checkbox
            title="已封存專案"
            checked={useFilterStore().filter().includeArchivedProjects}
            onInput={(e) =>
              useFilterStore().setIncludeArchivedProjects(
                e.currentTarget.checked
              )
            }
          />
        </div>
        <SectionLabel>所屬專案</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {filtedProjects().map((project) => (
            <Checkbox
              title={project.name}
              checked={
                useFilterStore().filter().projectIds?.includes(project.id) ??
                false
              }
              onChange={(e) =>
                setHasProject(project.id, e.currentTarget.checked)
              }
            />
          ))}
        </div>
        <SectionLabel>標籤</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {labels().map((label) => (
            <Checkbox
              checked={
                useFilterStore().filter().labelIds?.includes(label.id) ?? false
              }
              onChange={(e) => setHasLabel(label.id, e.currentTarget.checked)}
            >
              <span
                class="px-1 py-0.5 rounded"
                style={{
                  "background-color": label.color,
                  color: getLabelTextColor(label.color),
                }}
              >
                {label.name}
              </span>
            </Checkbox>
          ))}
        </div>
        <SectionLabel>人員</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {persons().map((person) => (
            <Checkbox
              title={person.name}
              checked={
                useFilterStore().filter().personIds?.includes(person.id) ??
                false
              }
              onChange={(e) => setHasPerson(person.id, e.currentTarget.checked)}
            />
          ))}
        </div>
      </PanelSections>
    </Panel>
  );
}
