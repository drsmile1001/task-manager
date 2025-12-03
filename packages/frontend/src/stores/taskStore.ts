import { client } from "@frontend/client";
import { createSignal } from "solid-js";

import type { Task } from "@backend/schemas/Task";

export function createTaskStore() {
  const [tasks, setTasks] = createSignal<Task[]>([]);

  async function loadTasks() {
    const result = await client.api.tasks.get();
    if (result.error) {
      throw new Error("Failed to load tasks");
    }
    setTasks(result.data);
  }
  loadTasks();

  async function createTask(newTask: Task) {
    setTasks((prev) => [...prev, newTask]);
  }

  async function updateTask(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function getTask(id: string): Task | undefined {
    return tasks().find((t) => t.id === id);
  }

  function listByProject(projectId: string) {
    return tasks()
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    listByProject,
  };
}

export type TaskStore = ReturnType<typeof createTaskStore>;
