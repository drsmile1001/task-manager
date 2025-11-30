import { createMemo, createSignal, Show } from "solid-js";
import { persons, assignments } from "./data";
import TaskPool from "./components/TaskPool";
import ScheduleTable from "./components/ScheduleTable";
import { genWeek } from "./utils/date";
import { createTaskStore } from "./stores/taskStore";
import TaskDetailsPanel from "./components/TaskDetailsPanel";
import type { Task } from "./domain/task";

export default function App() {
  const taskStore = createTaskStore();
  const week = genWeek();
  const [selectedTaskId, setSelectedTaskId] = createSignal<string | null>(null);
  const [isCreating, setIsCreating] = createSignal(false);

  const tasks = taskStore.tasks();
  const tasksMap = createMemo(() =>
    Object.fromEntries(tasks.map((t) => [t.id, t.name]))
  );

  // 從 store 取出選中的 task 內容
  const selectedTask = () => {
    if (!selectedTaskId()) return null;
    return taskStore.getTask(selectedTaskId()!);
  };

  // 開啟新增窗口
  const openCreatePanel = () => {
    setSelectedTaskId(null);
    setIsCreating(true);
  };

  // 點擊某 task → 開啟編輯窗口
  const openEditPanel = (taskId: string) => {
    setIsCreating(false);
    setSelectedTaskId(taskId);
  };

  // 關閉窗口
  const closePanel = () => {
    setSelectedTaskId(null);
    setIsCreating(false);
  };

  // 點 scheduleTable assignment 也可開起編輯
  const handleAssignmentClick = (taskId: string) => {
    openEditPanel(taskId);
  };

  return (
    <div class="flex h-screen">
      {/* 左側工作池 */}
      <TaskPool
        taskStore={taskStore}
        onCreate={openCreatePanel}
        onSelectTask={openEditPanel}
      />

      {/* 中間排程區域 */}
      <div class="flex-1 overflow-hidden">
        <ScheduleTable
          persons={persons}
          week={week}
          assignments={assignments}
          tasksMap={tasksMap()}
          //onSelectAssignment={(a) => handleAssignmentClick(a.taskId)}
        />
      </div>

      {/* 右側詳細面板 */}
      <Show when={isCreating() || selectedTask()}>
        <TaskDetailsPanel
          task={selectedTask()}
          isCreating={isCreating()}
          onClose={closePanel}
          onSave={(task: Task) => {
            if (isCreating()) {
              taskStore.createTask(task);
            } else if (selectedTask()) {
              taskStore.updateTask(selectedTask()!.id, task);
            }
            closePanel();
          }}
        />
      </Show>
    </div>
  );
}
