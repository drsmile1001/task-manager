import { For } from "solid-js";
import type { TaskStore } from "../stores/taskStore";

export default function TaskPool(props: {
  taskStore: TaskStore;
  onCreate: () => void;
  onSelectTask: (taskId: string) => void;
}) {
  const { tasks } = props.taskStore;

  return (
    <div class="w-60 border-r h-full overflow-y-auto p-3 bg-gray-50">
      <div class="flex justify-between items-center mb-3">
        <h2 class="font-bold text-gray-700">工作清單</h2>
        <button
          class="px-2 py-1 bg-blue-500 text-white rounded text-sm"
          onClick={() => props.onCreate()}
        >
          新增
        </button>
      </div>

      <For each={tasks()}>
        {(t) => (
          <div
            class="p-2 mb-2 bg-white rounded shadow text-sm border cursor-pointer hover:bg-blue-50"
            onClick={() => props.onSelectTask(t.id)}
          >
            {t.name}
          </div>
        )}
      </For>
    </div>
  );
}
