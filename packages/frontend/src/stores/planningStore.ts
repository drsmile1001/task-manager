import { client } from "@frontend/client";
import { perfEnd, perfStart } from "@frontend/utils/perf";
import { singulation } from "@frontend/utils/singulation";
import { cloneDeep } from "lodash";
import { createStore } from "solid-js/store";

import type { Planning } from "@backend/schemas/Planning";

function createPlanningStore() {
  const [state, setState] = createStore({
    byId: {} as Record<string, Planning | undefined>,
    byTaskId: {} as Record<string, Planning[]>,
    byWeekStartDate: {} as Record<string, Planning[]>,
  });

  async function loadPlannings() {
    const loadToken = perfStart("planningStore:load");
    const apiToken = perfStart("planningStore:api.get");
    const result = await client.api.plannings.get();
    perfEnd(apiToken, { status: result.status }, 1);
    if (result.error) {
      perfEnd(loadToken, { error: true }, 1);
      throw new Error("Failed to load plannings");
    }

    const buildIndexToken = perfStart("planningStore:index.build", {
      count: result.data.length,
    });
    setState({ byId: {}, byTaskId: {}, byWeekStartDate: {} });
    for (const p of result.data) {
      setPlanningInternal(p);
    }
    perfEnd(buildIndexToken, undefined, 1);
    perfEnd(loadToken, { count: result.data.length }, 1);
  }
  loadPlannings();

  function setPlanningInternal(p: Planning) {
    const existing = cloneDeep(state.byId[p.id]);
    setState("byId", p.id, p);
    if (existing && existing.taskId !== p.taskId) {
      setState("byTaskId", existing.taskId, (list = []) =>
        list.filter((item) => item.id !== p.id)
      );
    }
    setState("byTaskId", p.taskId, (list = []) => {
      const idx = list.findIndex((item) => item.id === p.id);
      if (idx >= 0) {
        const updated = [...list];
        updated[idx] = p;
        return updated;
      } else {
        return [...list, p];
      }
    });
    if (existing && existing.weekStartDate !== p.weekStartDate) {
      setState("byWeekStartDate", existing.weekStartDate, (list = []) =>
        list.filter((item) => item.id !== p.id)
      );
    }
    setState("byWeekStartDate", p.weekStartDate, (list = []) => {
      const idx = list.findIndex((item) => item.id === p.id);
      if (idx >= 0) {
        const updated = [...list];
        updated[idx] = p;
        return updated;
      } else {
        return [...list, p];
      }
    });
  }

  async function setPlanning(p: Planning) {
    setPlanningInternal(p);
  }

  async function deletePlanning(id: string) {
    const planning = cloneDeep(state.byId[id]);
    if (!planning) return;
    setState("byId", id, undefined);
    setState("byTaskId", planning.taskId, (list = []) =>
      list.filter((item) => item.id !== id)
    );
    setState("byWeekStartDate", planning.weekStartDate, (list = []) =>
      list.filter((item) => item.id !== id)
    );
  }

  function getPlanning(id: string) {
    return state.byId[id];
  }

  function getPlanningsByTask(taskId: string) {
    return state.byTaskId[taskId] || [];
  }

  function getPlanningsByWeekStartDate(weekStartDate: string) {
    return state.byWeekStartDate[weekStartDate] || [];
  }

  return {
    setPlanning,
    deletePlanning,
    getPlanning,
    getPlanningsByTask,
    getPlanningsByWeekStartDate,
    loadPlannings,
  };
}

export const usePlanningStore = singulation(createPlanningStore);
