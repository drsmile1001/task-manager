import { createSignal, createEffect } from "solid-js";
import type { Task } from "../domain/task";
import {
  type TaskRepository,
  LocalStorageTaskRepository,
} from "../repositories/TaskRepository";

export function createTaskStore(
  repo: TaskRepository = new LocalStorageTaskRepository()
) {
  const [tasks, setTasks] = createSignal<Task[]>(repo.getAll());

  // --- persistence ---
  createEffect(() => {
    repo.saveAll(tasks());
  });

  // --- CRUD operations ---

  function createTask(input: Omit<Task, "id">) {
    const id = crypto.randomUUID();
    const newTask: Task = { id, ...input };
    setTasks((prev) => [...prev, newTask]);
    return newTask;
  }

  function updateTask(id: string, patch: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function getTask(id: string): Task | undefined {
    return tasks().find((t) => t.id === id);
  }

  function listByProject(projectId: string) {
    return tasks().filter((t) => t.projectId === projectId);
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
