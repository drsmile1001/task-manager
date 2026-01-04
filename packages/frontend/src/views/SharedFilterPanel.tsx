import Button from "@frontend/components/Button";
import { checkboxLabelClass } from "@frontend/components/Checkbox";
import Panel, { PanelSections, SectionLabel } from "@frontend/components/Panel";
import { useSharedFilterStore } from "@frontend/stores/SharedFilterStore";
import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";

export default function SharedFilterPanel() {
  const { labels } = useLabelStore();
  const { persons } = usePersonStore();
  const { nonArchivedProjects, getProject } = useProjectStore();
  const { sharedFilter, setSharedFilter } = useSharedFilterStore();
  const { milestones } = useMilestoneStore();

  function milestoneWithProjectName() {
    return milestones().map((milestone) => {
      const project = getProject(milestone.projectId);
      return {
        ...milestone,
        name: project ? `${project.name}:${milestone.name}` : milestone.name,
      };
    });
  }

  function clearFilter() {
    setSharedFilter({
      includeDoneTasks: true,
      includeArchivedTasks: false,
      labelIds: [],
      projectIds: [],
      milestoneIds: [],
      personIds: [],
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
              checked={sharedFilter.includeDoneTasks}
              onInput={(e) =>
                setSharedFilter({
                  includeDoneTasks: e.currentTarget.checked,
                })
              }
            />
            已完成工作
          </label>
          <label class={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={sharedFilter.includeArchivedTasks}
              onInput={(e) =>
                setSharedFilter({
                  includeArchivedTasks: e.currentTarget.checked,
                })
              }
            />
            已封存工作
          </label>
        </div>
        <SectionLabel>所屬專案</SectionLabel>
        <div class="flex flex-wrap gap-2">
          {nonArchivedProjects().map((project) => (
            <label class={checkboxLabelClass}>
              <input
                type="checkbox"
                checked={sharedFilter.projectIds?.includes(project.id) ?? false}
                onChange={(e) =>
                  setSharedFilter({
                    projectIds: e.currentTarget.checked
                      ? [...sharedFilter.projectIds, project.id]
                      : sharedFilter.projectIds.filter(
                          (id) => id !== project.id
                        ),
                  })
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
                  sharedFilter.milestoneIds?.includes(milestone.id) ?? false
                }
                onChange={(e) =>
                  setSharedFilter({
                    milestoneIds: e.currentTarget.checked
                      ? [...sharedFilter.milestoneIds, milestone.id]
                      : sharedFilter.milestoneIds.filter(
                          (id) => id !== milestone.id
                        ),
                  })
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
                checked={sharedFilter.labelIds?.includes(label.id) ?? false}
                onChange={(e) =>
                  setSharedFilter({
                    labelIds: e.currentTarget.checked
                      ? [...sharedFilter.labelIds, label.id]
                      : sharedFilter.labelIds.filter((id) => id !== label.id),
                  })
                }
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
                checked={sharedFilter.personIds?.includes(person.id) ?? false}
                onChange={(e) =>
                  setSharedFilter({
                    personIds: e.currentTarget.checked
                      ? [...sharedFilter.personIds, person.id]
                      : sharedFilter.personIds.filter((id) => id !== person.id),
                  })
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
