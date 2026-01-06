import { MilestoneBlock } from "@frontend/components/MilestoneBlock";
import Panel, { PanelList } from "@frontend/components/Panel";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import type { Component } from "solid-js";

export type ProjectArchivedMilestoneListProps = {
  projectId: string;
};

const ProjectArchivedMilestoneList: Component<
  ProjectArchivedMilestoneListProps
> = (props) => {
  const { getProject } = useProjectStore();
  const { getMilestonesByProjectId } = useMilestoneStore();
  const project = getProject(props.projectId);
  const archivedMilestones = () =>
    getMilestonesByProjectId(props.projectId).filter((m) => m.isArchived);

  return (
    <Panel title={`專案已封存里程碑 - ${project?.name || ""}`}>
      <PanelList items={archivedMilestones}>
        {(milestone) => <MilestoneBlock class="w-full" milestone={milestone} />}
      </PanelList>
    </Panel>
  );
};

export default ProjectArchivedMilestoneList;
