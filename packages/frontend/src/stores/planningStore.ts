import { client } from "@frontend/client";
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

  function buildPlanningState(plannings: Planning[]) {
    const byId: Record<string, Planning | undefined> = {};
    const byTaskId: Record<string, Planning[]> = {};
    const byWeekStartDate: Record<string, Planning[]> = {};

    for (const planning of plannings) {
      byId[planning.id] = planning;

      if (!byTaskId[planning.taskId]) {
        byTaskId[planning.taskId] = [];
      }
      byTaskId[planning.taskId].push(planning);

      if (!byWeekStartDate[planning.weekStartDate]) {
        byWeekStartDate[planning.weekStartDate] = [];
      }
      byWeekStartDate[planning.weekStartDate].push(planning);
    }

    return {
      byId,
      byTaskId,
      byWeekStartDate,
    };
  }

  async function loadPlannings() {
    const result = await client.api.plannings.get();
    if (result.error) {
      throw new Error("Failed to load plannings");
    }
    setState(buildPlanningState(result.data));
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

  async function deletePlanningsByTaskId(taskId: string) {
    await deletePlanningsByTaskIds([taskId]);
  }

  async function deletePlanningsByTaskIds(taskIds: string[]) {
    if (taskIds.length === 0) {
      return;
    }
    const taskIdSet = new Set(taskIds);
    const remainedPlannings = Object.values(state.byId).filter(
      (planning): planning is Planning =>
        !!planning && !taskIdSet.has(planning.taskId)
    );
    setState(buildPlanningState(remainedPlannings));
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
    deletePlanningsByTaskId,
    deletePlanningsByTaskIds,
    loadPlannings,
  };
}

export const usePlanningStore = singulation(createPlanningStore);
