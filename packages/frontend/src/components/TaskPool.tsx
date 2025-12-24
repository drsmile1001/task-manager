import { assignmentStore } from "@frontend/stores/assignmentStore";
import { dragStore } from "@frontend/stores/dragStore";
import { projectStore } from "@frontend/stores/projectStore";
import { taskStore } from "@frontend/stores/taskStore";
import { For } from "solid-js";

export type Props = {
  onCreateTask: (projectId: string) => void;
  onEditTask: (taskId: string) => void;
  onEditProject: (projectId: string) => void;
  onCreateProject: () => void;
};

export default function TaskPool(props: Props) {
  const { onCreateTask, onEditTask, onEditProject, onCreateProject } = props;

  return (
    <div class="w-72 border-r h-full overflow-y-auto p-3 bg-gray-50">
      <div class="flex justify-between items-center mb-3">
        <h2 class="font-bold text-gray-700">專案 & 工作</h2>
        <button
          class="px-2 py-1 bg-green-600 text-white rounded text-sm"
          onClick={() => onCreateProject()}
        >
          新增專案
        </button>
      </div>

      {/* 專案群組 */}
      <For each={projectStore.projects()}>
        {(p) => (
          <div class="mb-4">
            {/* 專案標題 */}
            <div
              class="flex justify-between items-center font-medium text-gray-800 cursor-pointer hover:text-blue-600"
              onClick={() => onEditProject(p.id)}
            >
              <span>{p.name}</span>
              <span class="text-sm text-blue-500 hover:underline">編輯</span>
            </div>

            {/* 該專案的工作清單 */}
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

                  return (
                    <div
                      class={className()}
                      onClick={() => onEditTask(t.id)}
                      draggable="true"
                      onDragStart={() => {
                        dragStore.startTaskDrag(t.id);
                      }}
                    >
                      {t.name}
                    </div>
                  );
                }}
              </For>

              {/* 新增工作 */}
              <button
                class="text-blue-600 text-sm mt-1"
                onClick={() => onCreateTask(p.id)}
              >
                ＋ 新增工作
              </button>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
