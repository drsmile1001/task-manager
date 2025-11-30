import { For } from "solid-js";
import type { TaskStore } from "../stores/taskStore";
import type { ProjectStore } from "../stores/projectStore";

export type Props = {
  taskStore: TaskStore;
  projectStore: ProjectStore;
  onCreateTask: (projectId: string) => void;
  onEditTask: (taskId: string) => void;
  onEditProject: (projectId: string) => void;
  onCreateProject: () => void;
};

export default function TaskPool(props: Props) {
  const {
    taskStore,
    projectStore,
    onCreateTask,
    onEditTask,
    onEditProject,
    onCreateProject,
  } = props;

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
                {(t) => (
                  <div
                    class="p-1 bg-white border rounded text-sm shadow cursor-pointer hover:bg-blue-50"
                    onClick={() => onEditTask(t.id)}
                  >
                    {t.name}
                  </div>
                )}
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
