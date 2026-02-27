import type { PanelOptions } from "@frontend/stores/PanelController";

import type { Task } from "@backend/schemas/Task";

type CreateTaskAndOpenArgs = {
  task: Task;
  postTask: (task: Task) => Promise<unknown>;
  setTask: (task: Task) => Promise<void> | void;
  pushPanel: (panel: Extract<PanelOptions, { type: "TASK" }>) => void;
};

export async function createTaskAndOpen({
  task,
  postTask,
  setTask,
  pushPanel,
}: CreateTaskAndOpenArgs) {
  await postTask(task);
  await setTask(task);
  pushPanel({ type: "TASK", taskId: task.id });
}
