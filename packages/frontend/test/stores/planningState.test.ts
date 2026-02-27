import { describe, expect, it } from "bun:test";

import {
  buildPlanningState,
  deletePlanningsByTaskIds,
} from "../../src/stores/reducers/planningState";

const plannings = [
  {
    id: "pl-1",
    taskId: "t-1",
    weekStartDate: "2026-02-23",
  },
  {
    id: "pl-2",
    taskId: "t-1",
    weekStartDate: "2026-03-02",
  },
  {
    id: "pl-3",
    taskId: "t-2",
    weekStartDate: "2026-03-02",
  },
];

describe("planningState reducer", () => {
  it("可建立 byId/byTaskId/byWeekStartDate 索引", () => {
    const state = buildPlanningState(plannings);

    expect(Object.keys(state.byId)).toEqual(["pl-1", "pl-2", "pl-3"]);
    expect(state.byTaskId["t-1"].map((item) => item.id)).toEqual([
      "pl-1",
      "pl-2",
    ]);
    expect(state.byWeekStartDate["2026-03-02"].map((item) => item.id)).toEqual([
      "pl-2",
      "pl-3",
    ]);
  });

  it("可刪除指定 taskIds 的 plannings", () => {
    const state = buildPlanningState(plannings);
    const nextState = deletePlanningsByTaskIds(state, ["t-1"]);

    expect(Object.keys(nextState.byId)).toEqual(["pl-3"]);
    expect(nextState.byTaskId["t-1"]).toBeUndefined();
    expect(
      nextState.byWeekStartDate["2026-03-02"].map((item) => item.id)
    ).toEqual(["pl-3"]);
  });
});
