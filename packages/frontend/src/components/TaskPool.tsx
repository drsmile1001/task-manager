import { client } from "@frontend/client";
import { useAssignmentStore } from "@frontend/stores/assignmentStore";
import { useDragStore } from "@frontend/stores/dragStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { For } from "solid-js";
import { ulid } from "ulid";

import type { Project } from "@backend/schemas/Project";
import type { Task } from "@backend/schemas/Task";

import Button from "./Button";
import LabelLine from "./LabelLine";

export type Props = {
  onEditTask: (taskId: string) => void;
};

export default function TaskPool(props: Props) {
  const { filteredProjects } = useProjectStore();

  return (
    <div class="h-full flex-none w-[clamp(15rem,15vw,25rem)] border-r overflow-y-auto p-3 bg-gray-50">
      <div class="flex justify-between items-center mb-3">
        <h2 class="font-bold text-gray-700">專案 & 工作</h2>
      </div>
      <For each={filteredProjects()}>
        {(p) => <ProjectBlock {...props} p={p} />}
      </For>
    </div>
  );
}

function ProjectBlock(props: Props & { p: Project }) {
  const { p } = props;

  async function onCreateTask(projectId: string) {
    const taskId = ulid();
    await client.api.tasks.post({
      id: taskId,
      projectId: projectId,
      name: "新工作",
      description: "",
      isDone: false,
      labelIds: [],
      isArchived: false,
      dueDate: null,
      assigneeIds: [],
    });
    props.onEditTask(taskId);
  }

  return (
    <div class="mb-4">
      <div
        class="flex justify-between items-center font-medium"
        classList={{
          "text-gray-800": !p.isArchived,
          "text-gray-400": p.isArchived,
        }}
      >
        <span>{p.name}</span>
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

function TaskBlock(props: Props & { t: Task; p: Project }) {
  const { onEditTask, t, p } = props;
  const assigned = () => useAssignmentStore().listByTask(t.id).length > 0;
  const isArchived = () => t.isArchived || p.isArchived;
  return (
    <div
      class="p-1 border rounded text-sm shadow cursor-pointer"
      classList={{
        "bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-400":
          isArchived(),
        "bg-green-50 border-green-400 hover:bg-green-100":
          !isArchived() && assigned(),
        "bg-yellow-50 border-yellow-400 hover:bg-yellow-100":
          !isArchived() && !assigned(),
        "line-through": t.isDone,
      }}
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
