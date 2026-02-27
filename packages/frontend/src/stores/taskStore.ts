import { client } from "@frontend/client";
import { perfEnd, perfStart } from "@frontend/utils/perf";
import { singulation } from "@frontend/utils/singulation";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

import type { Task } from "@backend/public";

import { useAssignmentStore } from "./assignmentStore";
import { useLabelStore } from "./labelStore";
import { useMilestoneStore } from "./milestoneStore";
import { usePersonStore } from "./personStore";
import { usePlanningStore } from "./planningStore";
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

  async function setTask(task: Task) {
    setMap(task.id, task);
  }

  async function deleteTask(id: string) {
    setMap(id, undefined);
  }

  function getTaskIdsByProjectId(projectId: string) {
    return Object.values(map)
      .filter((task): task is Task => !!task && task.projectId === projectId)
      .map((task) => task.id);
  }

  function deleteTasksByProjectId(projectId: string) {
    const deletedTaskIds = getTaskIdsByProjectId(projectId);
    if (deletedTaskIds.length === 0) {
      return deletedTaskIds;
    }

    const projectTaskIdSet = new Set(deletedTaskIds);
    const remainedTasks = Object.values(map).filter(
      (task): task is Task => !!task && !projectTaskIdSet.has(task.id)
    );
    setMap(Object.fromEntries(remainedTasks.map((task) => [task.id, task])));

    return deletedTaskIds;
  }

  function applyMilestoneDueDateToTasks(
    milestoneId: string,
    dueDate: string | null
  ) {
    let hasUpdated = false;
    const updatedTasks = Object.values(map)
      .filter((task): task is Task => !!task)
      .map((task) => {
        if (task.milestoneId !== milestoneId) {
          return task;
        }
        if (task.dueDate === dueDate) {
          return task;
        }
        hasUpdated = true;
        return {
          ...task,
          dueDate,
        };
      });

    if (!hasUpdated) {
      return;
    }

    setMap(Object.fromEntries(updatedTasks.map((task) => [task.id, task])));
  }

  function clearMilestoneFromTasks(milestoneId: string) {
    let hasUpdated = false;
    const updatedTasks = Object.values(map)
      .filter((task): task is Task => !!task)
      .map((task) => {
        if (task.milestoneId !== milestoneId) {
          return task;
        }
        hasUpdated = true;
        return {
          ...task,
          milestoneId: null,
        };
      });

    if (!hasUpdated) {
      return;
    }

    setMap(Object.fromEntries(updatedTasks.map((task) => [task.id, task])));
  }

  function removeLabelFromTasks(labelId: string) {
    let hasUpdated = false;
    const updatedTasks = Object.values(map)
      .filter((task): task is Task => !!task)
      .map((task) => {
        if (!task.labelIds.includes(labelId)) {
          return task;
        }
        hasUpdated = true;
        return {
          ...task,
          labelIds: task.labelIds.filter((id) => id !== labelId),
        };
      });

    if (!hasUpdated) {
      return;
    }

    setMap(Object.fromEntries(updatedTasks.map((task) => [task.id, task])));
  }

  function getTask(id: string): Task | undefined {
    return map[id];
  }

  const tasksWithRelationMap = createMemo(() => {
    const relationToken = perfStart("taskStore:relation.recompute", {
      taskCount: Object.values(map).filter((t) => t !== undefined).length,
    });
    const { getProject } = useProjectStore();
    const { getPerson } = usePersonStore();
    const { getLabel } = useLabelStore();
    const { getMilestone } = useMilestoneStore();
    const { getAssignmentsByTask } = useAssignmentStore();
    const { getPlanningsByTask } = usePlanningStore();
    const relationMap = new Map(
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
          const plannings = getPlanningsByTask(task.id);
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
              plannings,
            },
          ];
        })
    );
    perfEnd(relationToken, { relationCount: relationMap.size }, 16);
    return relationMap;
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
    deleteTasksByProjectId,
    getTask,
    getTaskIdsByProjectId,
    loadTasks,
    applyMilestoneDueDateToTasks,
    clearMilestoneFromTasks,
    removeLabelFromTasks,
    getTaskWithRelation,
    tasksWithRelation,
  };
}

export const useTaskStore = singulation(createTaskStore);

export type TaskWithRelation = ReturnType<
  ReturnType<typeof useTaskStore>["tasksWithRelation"]
>[number];
