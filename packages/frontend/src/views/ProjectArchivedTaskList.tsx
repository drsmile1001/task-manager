import Panel, { PanelList } from "@frontend/components/Panel";
import { TaskBlock } from "@frontend/components/TaskBlock";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { type Component, createMemo } from "solid-js";

export type ProjectArchivedTaskListProps = {
  projectId: string;
};

const ProjectArchivedTaskList: Component<ProjectArchivedTaskListProps> = (
  props
) => {
  const { getProject } = useProjectStore();
  const { tasksWithRelation } = useTaskStore();
  const project = getProject(props.projectId);
  const archivedTasks = createMemo(() =>
    tasksWithRelation().filter(
      (task) => task.projectId === props.projectId && task.isArchived
    )
  );

  return (
    <Panel title={`專案已封存工作 - ${project?.name || ""}`}>
      <PanelList items={archivedTasks}>
        {(task) => (
          <TaskBlock
            class="w-full"
            task={task}
            showProject={false}
            showMilestone={true}
          />
        )}
      </PanelList>
    </Panel>
  );
};

export default ProjectArchivedTaskList;
