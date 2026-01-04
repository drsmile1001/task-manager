import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

import type { Task } from "@backend/schemas/Task";

import { useAssignmentStore } from "./assignmentStore";
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
    setMap(
      Object.fromEntries(
        result.data.map((task) => [
          task.id,
          {
            ...task,
            dueDate:
              (task.dueDate as unknown as Date | null)
                ?.toISOString()
                .split("T")[0] ?? null,
          },
        ])
      )
    );
  }
  loadTasks();

  async function setTask(task: Task) {
    setMap(task.id, task);
  }

  async function deleteTask(id: string) {
    setMap(id, undefined);
  }

  function getTask(id: string): Task | undefined {
    return map[id];
  }

  const tasksWithRelationMap = createMemo(() => {
    const { getProject } = useProjectStore();
    const { getPerson } = usePersonStore();
    const { getLabel } = useLabelStore();
    const { getMilestone } = useMilestoneStore();
    const { getAssignmentsByTask } = useAssignmentStore();
    return new Map(
      Object.values(map)
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
          const assignments = getAssignmentsByTask(task.id);
          const priority =
            labels.length === 0
              ? Number.MAX_SAFE_INTEGER
              : Math.min(
                  ...labels.map((l) => l.priority ?? Number.MAX_SAFE_INTEGER)
                );
          return [
            task.id,
            {
              ...task,
              project,
              milestone,
              assignees,
              labels,
              priority,
              assignments,
            },
          ];
        })
    );
  });

  function getTaskWithRelation(id: string) {
    return tasksWithRelationMap().get(id);
  }

  function tasksWithRelation() {
    return [...tasksWithRelationMap().values()];
  }

  return {
    setTask,
    deleteTask,
    getTask,
    loadTasks,
    getTaskWithRelation,
    tasksWithRelation,
  };
}

export const useTaskStore = singulation(createTaskStore);

export type TaskWithRelation = ReturnType<
  ReturnType<typeof useTaskStore>["tasksWithRelation"]
>[number];
