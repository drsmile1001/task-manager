import type { Planning } from "@backend/public";

export type PlanningState = {
  byId: Record<string, Planning | undefined>;
  byTaskId: Record<string, Planning[]>;
  byWeekStartDate: Record<string, Planning[]>;
};

export function buildPlanningState(plannings: Planning[]): PlanningState {
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

export function deletePlanningsByTaskIds(
  state: PlanningState,
  taskIds: string[]
) {
  if (taskIds.length === 0) {
    return state;
  }
  const taskIdSet = new Set(taskIds);
  const remainedPlannings = Object.values(state.byId).filter(
    (planning): planning is Planning =>
      !!planning && !taskIdSet.has(planning.taskId)
  );
  return buildPlanningState(remainedPlannings);
}
