import { client } from "@frontend/client";
import { perfEnd, perfStart } from "@frontend/utils/perf";
import { singulation } from "@frontend/utils/singulation";
import { cloneDeep } from "lodash";
import { createStore } from "solid-js/store";

import type { Assignment } from "@backend/schemas/Assignment";

function createAssignmentStore() {
  const [state, setState] = createStore({
    byId: {} as Record<string, Assignment | undefined>,
    byTaskId: {} as Record<string, Assignment[]>,
    byPersonIdAndDate: {} as Record<string, Assignment[]>,
  });

  function byPersonIdAndDateKey(personId: string, date: string) {
    return `${personId}::${date}`;
  }

  async function loadAssignments() {
    const loadToken = perfStart("assignmentStore:load");
    const apiToken = perfStart("assignmentStore:api.get");
    const result = await client.api.assignments.get();
    perfEnd(apiToken, { status: result.status }, 1);
    if (result.error) {
      perfEnd(loadToken, { error: true }, 1);
      throw new Error("Failed to load assignments");
    }

    const buildIndexToken = perfStart("assignmentStore:index.build", {
      count: result.data.length,
    });
    const byId: Record<string, Assignment | undefined> = {};
    const byTaskId: Record<string, Assignment[]> = {};
    const byPersonIdAndDate: Record<string, Assignment[]> = {};
    for (const assignment of result.data) {
      byId[assignment.id] = assignment;

      if (!byTaskId[assignment.taskId]) {
        byTaskId[assignment.taskId] = [];
      }
      byTaskId[assignment.taskId].push(assignment);

      const personDateKey = byPersonIdAndDateKey(
        assignment.personId,
        assignment.date
      );
      if (!byPersonIdAndDate[personDateKey]) {
        byPersonIdAndDate[personDateKey] = [];
      }
      byPersonIdAndDate[personDateKey].push(assignment);
    }

    setState({
      byId,
      byTaskId,
      byPersonIdAndDate,
    });
    perfEnd(buildIndexToken, undefined, 1);
    perfEnd(loadToken, { count: result.data.length }, 1);
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

  async function deleteAssignmentsByTaskId(taskId: string) {
    const assignments = [...(state.byTaskId[taskId] || [])];
    if (assignments.length === 0) {
      return;
    }

    for (const assignment of assignments) {
      setState("byId", assignment.id, undefined);
      const key = byPersonIdAndDateKey(assignment.personId, assignment.date);
      setState("byPersonIdAndDate", key, (list = []) =>
        list.filter((item) => item.id !== assignment.id)
      );
    }

    setState("byTaskId", taskId, []);
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
    loadAssignments,
  };
}

export const useAssignmentStore = singulation(createAssignmentStore);
