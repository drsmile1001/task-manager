import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createSignal } from "solid-js";

import type { Task } from "@backend/schemas/Task";

import { useFilterStore } from "./filterStore";
import { useLabelStore } from "./labelStore";

function createTaskStore() {
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
    const labelPriorityMap = new Map<string, number>(
      useLabelStore()
        .labels()
        .map((label) => [label.id, label.priority ?? Number.MAX_SAFE_INTEGER])
    );
    return tasks()
      .filter((t) => t.projectId === projectId)
      .filter((t) => {
        const filter = useFilterStore().filter();
        if (
          filter.projectIds &&
          filter.projectIds.length &&
          !filter.projectIds.includes(t.projectId)
        )
          return false;
        if (!filter.includeDoneTasks && t.isDone) return false;
        if (filter.labelIds && filter.labelIds.length > 0) {
          const hasLabel = filter.labelIds.some((labelId) =>
            t.labelIds?.includes(labelId)
          );
          if (!hasLabel) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ap = (a.labelIds ?? []).reduce((min, id) => {
          const p = labelPriorityMap.get(id) ?? Number.MAX_SAFE_INTEGER;
          return Math.min(min, p);
        }, Number.MAX_SAFE_INTEGER);
        const bp = (b.labelIds ?? []).reduce((min, id) => {
          const p = labelPriorityMap.get(id) ?? Number.MAX_SAFE_INTEGER;
          return Math.min(min, p);
        }, Number.MAX_SAFE_INTEGER);
        if (ap !== bp) {
          return ap - bp;
        }
        return a.name.localeCompare(b.name);
      });
  }

  return {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    listByProject,
    loadTasks,
  };
}

export const useTaskStore = singulation(createTaskStore);
