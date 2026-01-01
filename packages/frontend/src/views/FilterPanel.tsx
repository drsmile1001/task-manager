import Button from "@frontend/components/Button";
import { checkboxLabelClass } from "@frontend/components/Checkbox";
import Panel, { PanelSections, SectionLabel } from "@frontend/components/Panel";
import { useFilterStore } from "@frontend/stores/filterStore";
import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";

export default function FilterPanel() {
  const { labels } = useLabelStore();
  const { persons } = usePersonStore();
  const { projects } = useProjectStore();
  const { filter } = useFilterStore();
  const { milestones } = useMilestoneStore();

  function filtedProjects() {
    return projects().filter((project) => {
      if (filter().includeArchivedProjects) {
        return true;
      }
      return !project.isArchived;
    });
  }

  function milestoneWithProjectName() {
    return milestones().map((milestone) => {
      const project = projects().find((p) => p.id === milestone.projectId);
      return {
        ...milestone,
        name: project ? `${project.name}:${milestone.name}` : milestone.name,
      };
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

  function setHasMilestone(milestoneId: string, has: boolean) {
    const currentMilestoneIds = useFilterStore().filter().milestoneIds ?? [];
    useFilterStore().setFilter({
      ...useFilterStore().filter(),
      milestoneIds: has
        ? [...currentMilestoneIds, milestoneId]
        : currentMilestoneIds.filter((id) => id !== milestoneId),
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
      milestoneIds: [],
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
          <label class={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={useFilterStore().filter().includeDoneTasks}
              onInput={(e) =>
                useFilterStore().setIncludeDoneTasks(e.currentTarget.checked)
              }
            />
            已完成工作
          </label>
          <label class={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={useFilterStore().filter().includeArchivedTasks}
              onInput={(e) =>
                useFilterStore().setIncludeArchivedTasks(
                  e.currentTarget.checked
                )
              }
            />
            已封存工作
          </label>
          <label class={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={useFilterStore().filter().includeArchivedProjects}
              onInput={(e) =>
                useFilterStore().setIncludeArchivedProjects(
                  e.currentTarget.checked
                )
              }
            />
            已封存專案
          </label>
        </div>
        <SectionLabel>所屬專案</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {filtedProjects().map((project) => (
            <label class={checkboxLabelClass}>
              <input
                type="checkbox"
                checked={
                  useFilterStore().filter().projectIds?.includes(project.id) ??
                  false
                }
                onChange={(e) =>
                  setHasProject(project.id, e.currentTarget.checked)
                }
              />
              {project.name}
            </label>
          ))}
        </div>
        <SectionLabel>所屬里程碑</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {milestoneWithProjectName().map((milestone) => (
            <label class={checkboxLabelClass}>
              <input
                type="checkbox"
                checked={
                  useFilterStore()
                    .filter()
                    .milestoneIds?.includes(milestone.id) ?? false
                }
                onChange={(e) =>
                  setHasMilestone(milestone.id, e.currentTarget.checked)
                }
              />
              {milestone.name}
            </label>
          ))}
        </div>
        <SectionLabel>標籤</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {labels().map((label) => (
            <label class={checkboxLabelClass}>
              <input
                type="checkbox"
                checked={
                  useFilterStore().filter().labelIds?.includes(label.id) ??
                  false
                }
                onChange={(e) => setHasLabel(label.id, e.currentTarget.checked)}
              />
              <span
                class="px-1 py-0.5 rounded"
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
        <SectionLabel>人員</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {persons().map((person) => (
            <label class={checkboxLabelClass}>
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
      </PanelSections>
    </Panel>
  );
}
