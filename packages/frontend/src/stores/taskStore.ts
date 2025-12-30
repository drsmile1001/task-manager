import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

import type { Task } from "@backend/schemas/Task";

import { useLabelStore } from "./labelStore";
import { useMilestoneStore } from "./milestoneStore";
import { usePersonStore } from "./personStore";
import { useProjectStore } from "./projectStore";

function createTaskStore() {
  const [map, setMap] = createStore({} as Record<string, Task | undefined>);

  async function loadTasks() {
    const result = await client.api.tasks.get();
    if (result.error) {
      throw new Error("Failed to load tasks");
    }
    setMap(Object.fromEntries(result.data.map((task) => [task.id, task])));
  }
  loadTasks();

  async function createTask(newTask: Task) {
    setMap(newTask.id, newTask);
  }

  async function updateTask(task: Task) {
    setMap(task.id, task);
  }

  async function deleteTask(id: string) {
    setMap(id, undefined);
  }

  function getTask(id: string): Task | undefined {
    return map[id];
  }

  const tasksWithRelation = createMemo(() => {
    const { getProject } = useProjectStore();
    const { getPerson } = usePersonStore();
    const { getLabel } = useLabelStore();
    const { getMilestone } = useMilestoneStore();
    return Object.values(map)
      .filter((t): t is Task => t !== undefined)
      .map((task) => {
        const project = getProject(task.projectId);
        const milestone = task.milestoneId
          ? getMilestone(task.milestoneId)
          : undefined;
        const assignees = task.assigneeIds
          .map((personId) => getPerson(personId))
          .filter((p): p is NonNullable<typeof p> => p !== undefined);
        const labels = task.labelIds
          .map((labelId) => getLabel(labelId))
          .filter((l): l is NonNullable<typeof l> => l !== undefined);
        const priority = Math.min(
          ...labels.map((l) => l.priority ?? Number.MAX_SAFE_INTEGER)
        );
        return {
          ...task,
          project,
          milestone,
          assignees,
          labels,
          priority,
        };
      });
  });

  return {
    createTask,
    updateTask,
    deleteTask,
    getTask,
    loadTasks,
    tasksWithRelation,
  };
}

export const useTaskStore = singulation(createTaskStore);

export type TaskWithRelation = ReturnType<
  ReturnType<typeof useTaskStore>["tasksWithRelation"]
>[number];
