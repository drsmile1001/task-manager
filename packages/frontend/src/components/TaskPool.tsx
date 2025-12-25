import { assignmentStore } from "@frontend/stores/assignmentStore";
import { dragStore } from "@frontend/stores/dragStore";
import { filterStore } from "@frontend/stores/filterStore";
import { getLabelTextColor, labelStore } from "@frontend/stores/labelStore";
import { projectStore } from "@frontend/stores/projectStore";
import { taskStore } from "@frontend/stores/taskStore";
import { For } from "solid-js";

import Button from "./Button";

export type Props = {
  onCreateTask: (projectId: string) => void;
  onEditTask: (taskId: string) => void;
  onEditProject: (projectId: string) => void;
  onCreateProject: () => void;
};

export default function TaskPool(props: Props) {
  const { onCreateTask, onEditTask, onEditProject, onCreateProject } = props;

  const filteredProjects = () =>
    projectStore
      .projects()
      .filter(
        (p) =>
          !filterStore.filter().projectIds ||
          filterStore.filter().projectIds!.length === 0 ||
          filterStore.filter().projectIds!.includes(p.id)
      );

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
        {(p) => (
          <div class="mb-4">
            <div
              class="flex justify-between items-center font-medium text-gray-800 cursor-pointer hover:text-blue-600"
              onClick={() => onEditProject(p.id)}
            >
              <span>{p.name}</span>
              <span class="text-sm text-blue-500 hover:underline">編輯</span>
            </div>

            <div class="pl-4 mt-2 space-y-1">
              <For each={taskStore.listByProject(p.id)}>
                {(t) => {
                  const assigned = () =>
                    assignmentStore.listByTask(t.id).length > 0;
                  const isDone = () => t.isDone;

                  const className = () =>
                    "p-1 border rounded text-sm shadow cursor-pointer " +
                    (assigned() || isDone()
                      ? "bg-green-50 border-green-400 hover:bg-green-100"
                      : "bg-yellow-50 border-yellow-400 hover:bg-yellow-100") +
                    (isDone()
                      ? " line-through text-gray-400"
                      : " text-gray-800");

                  const labels = () =>
                    (t.labelIds ?? [])
                      .map((labelId) =>
                        labelStore.labels().find((l) => l.id === labelId)
                      )
                      .filter((l) => !!l)
                      .sort((a, b) => {
                        const pa = a.priority ?? Number.MAX_SAFE_INTEGER;
                        const pb = b.priority ?? Number.MAX_SAFE_INTEGER;
                        if (pa !== pb) return pa - pb;
                        return a.name.localeCompare(b.name);
                      });

                  return (
                    <div
                      class={className()}
                      onClick={() => onEditTask(t.id)}
                      draggable="true"
                      onDragStart={() => {
                        dragStore.startTaskDrag(t.id);
                      }}
                    >
                      <span>{t.name}</span>
                      <div class="flex justify-end">
                        {labels().map((label) => (
                          <span
                            class="text-xs px-1 py-0.5 rounded mr-1"
                            style={{
                              "background-color": label.color,
                              color: getLabelTextColor(label.color),
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }}
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
        )}
      </For>
    </div>
  );
}
