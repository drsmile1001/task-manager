import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { cloneDeep } from "lodash";
import { createStore } from "solid-js/store";

import type { Assignment } from "@backend/schemas/Assignment";

import {
  buildAssignmentState,
  byPersonIdAndDateKey,
  deleteAssignmentsByPersonId as reduceDeleteAssignmentsByPersonId,
  deleteAssignmentsByTaskIds as reduceDeleteAssignmentsByTaskIds,
} from "./reducers/assignmentState";

function createAssignmentStore() {
  const [state, setState] = createStore({
    byId: {} as Record<string, Assignment | undefined>,
    byTaskId: {} as Record<string, Assignment[]>,
    byPersonIdAndDate: {} as Record<string, Assignment[]>,
  });

  async function loadAssignments() {
    const result = await client.api.assignments.get();
    if (result.error) {
      throw new Error("Failed to load assignments");
    }
    setState(buildAssignmentState(result.data));
  }
  loadAssignments();

  function setAssignmentInternal(a: Assignment) {
    const existing = cloneDeep(state.byId[a.id]);
    setState("byId", a.id, a);
    if (existing && existing.taskId !== a.taskId) {
      setState("byTaskId", existing.taskId, (list = []) =>
        list.filter((item) => item.id !== a.id)
      );
    }
    setState("byTaskId", a.taskId, (list = []) => {
      const index = list.findIndex((item) => item.id === a.id);
      if (index >= 0) {
        list[index] = a;
        return list;
      } else {
        return [...list, a];
      }
    });

    if (
      existing &&
      (existing.personId !== a.personId || existing.date !== a.date)
    ) {
      const oldKey = byPersonIdAndDateKey(existing.personId, existing.date);
      const list = state.byPersonIdAndDate[oldKey] || [];
      setState("byPersonIdAndDate", oldKey, [
        ...list.filter((item) => item.id !== a.id),
      ]);
    }
    const key = byPersonIdAndDateKey(a.personId, a.date);
    setState("byPersonIdAndDate", key, (list = []) => {
      const index = list.findIndex((item) => item.id === a.id);
      if (index >= 0) {
        list[index] = a;
        return list;
      } else {
        return [...list, a];
      }
    });
  }

  async function setAssignment(a: Assignment) {
    setAssignmentInternal(a);
  }

  async function deleteAssignment(id: string) {
    const assignment = cloneDeep(state.byId[id]);
    if (!assignment) {
      return;
    }
    setState("byId", id, undefined);
    setState("byTaskId", assignment.taskId, (list = []) =>
      list.filter((item) => item.id !== id)
    );
    const key = byPersonIdAndDateKey(assignment.personId, assignment.date);
    setState("byPersonIdAndDate", key, (list = []) =>
      list.filter((item) => item.id !== id)
    );
  }

  async function deleteAssignmentsByTaskIds(taskIds: string[]) {
    setState(reduceDeleteAssignmentsByTaskIds(state, taskIds));
  }

  async function deleteAssignmentsByTaskId(taskId: string) {
    await deleteAssignmentsByTaskIds([taskId]);
  }

  async function deleteAssignmentsByPersonId(personId: string) {
    setState(reduceDeleteAssignmentsByPersonId(state, personId));
  }

  function getAssignmentsByTask(taskId: string) {
    return state.byTaskId[taskId] || [];
  }

  function getAssignmentsByPersonAndDate(personId: string, date: string) {
    return state.byPersonIdAndDate[byPersonIdAndDateKey(personId, date)] || [];
  }

  function getAssignment(assignmentId: string) {
    return state.byId[assignmentId];
  }

  return {
    setAssignment,
    deleteAssignment,
    getAssignment,
    getAssignmentsByTask,
    getAssignmentsByPersonAndDate,
    deleteAssignmentsByTaskId,
    deleteAssignmentsByTaskIds,
    deleteAssignmentsByPersonId,
    loadAssignments,
  };
}

export const useAssignmentStore = singulation(createAssignmentStore);
