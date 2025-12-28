import { useAssignmentStore } from "@frontend/stores/assignmentStore";
import { useDragStore } from "@frontend/stores/dragStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { For } from "solid-js";

import type { Project } from "@backend/schemas/Project";
import type { Task } from "@backend/schemas/Task";

import Button from "./Button";
import LabelLine from "./LabelLine";

export type Props = {
  onCreateTask: (projectId: string) => void;
  onEditTask: (taskId: string) => void;
  onEditProject: (projectId: string) => void;
  onCreateProject: () => void;
};

export default function TaskPool(props: Props) {
  const { onCreateProject } = props;
  const { filteredProjects } = useProjectStore();

  return (
    <div class="h-full flex-none w-[clamp(15rem,15vw,25rem)] border-r overflow-y-auto p-3 bg-gray-50">
      <div class="flex justify-between items-center mb-3">
        <h2 class="font-bold text-gray-700">專案 & 工作</h2>

        <Button
          variant="secondary"
          size="small"
          onClick={() => onCreateProject()}
        >
          新增專案
        </Button>
      </div>
      <For each={filteredProjects()}>
        {(p) => <ProjectBlock {...props} p={p} />}
      </For>
    </div>
  );
}

function ProjectBlock(props: Props & { p: Project }) {
  const { onCreateTask, onEditProject, p } = props;
  return (
    <div class="mb-4">
      <div class="flex justify-between items-center font-medium text-gray-800">
        <span>{p.name}</span>
        <Button
          variant="secondary"
          size="small"
          onClick={() => onEditProject(p.id)}
        >
          編輯
        </Button>
      </div>

      <div class="pl-4 mt-2 space-y-1">
        <For each={useTaskStore().listByProject(p.id)}>
          {(t) => <TaskBlock {...props} t={t} />}
        </For>

        <Button
          variant="secondary"
          size="small"
          onClick={() => onCreateTask(p.id)}
        >
          ＋ 新增工作
        </Button>
      </div>
    </div>
  );
}

function TaskBlock(props: Props & { t: Task }) {
  const { onEditTask, t } = props;
  const assigned = () => useAssignmentStore().listByTask(t.id).length > 0;
  const isDone = () => t.isDone;

  const className = () =>
    "p-1 border rounded text-sm shadow cursor-pointer " +
    (assigned() || isDone()
      ? "bg-green-50 border-green-400 hover:bg-green-100"
      : "bg-yellow-50 border-yellow-400 hover:bg-yellow-100") +
    (isDone() ? " line-through text-gray-400" : " text-gray-800");

  return (
    <div
      class={className()}
      onClick={() => onEditTask(t.id)}
      draggable="true"
      onDragStart={() => {
        useDragStore().startTaskDrag(t.id);
      }}
    >
      <span>{t.name}</span>
      <LabelLine labelIds={() => t.labelIds ?? []} />
    </div>
  );
}
