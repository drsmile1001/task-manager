import { client } from "@frontend/client";
import { createSignal } from "solid-js";
import { ulid } from "ulid";

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
  setInterval(() => {
    loadTasks();
  }, 10000);

  async function createTask(input: Omit<Task, "id">) {
    const id = ulid();
    const newTask: Task = { id, ...input };
    const result = await client.api.tasks.post(newTask);
    if (result.error) {
      throw new Error("Failed to create task");
    }
    setTasks((prev) => [...prev, newTask]);
    return newTask;
  }

  async function updateTask(id: string, patch: Partial<Task>) {
    const result = await client.api.tasks({ id }).patch(patch);
    if (result.error) {
      throw new Error("Failed to update task");
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function deleteTask(id: string) {
    const result = await client.api.tasks({ id }).delete();
    if (result.error) {
      throw new Error("Failed to delete task");
    }
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
