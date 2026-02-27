import { describe, expect, it } from "bun:test";

import {
  buildAssignmentState,
  byPersonIdAndDateKey,
  deleteAssignmentsByPersonId,
  deleteAssignmentsByTaskIds,
} from "../../src/stores/reducers/assignmentState";

const assignments = [
  {
    id: "a-1",
    taskId: "t-1",
    personId: "p-1",
    date: "2026-02-27",
    acknowledged: false,
  },
  {
    id: "a-2",
    taskId: "t-1",
    personId: "p-2",
    date: "2026-02-27",
    acknowledged: true,
  },
  {
    id: "a-3",
    taskId: "t-2",
    personId: "p-1",
    date: "2026-03-01",
    acknowledged: false,
  },
];

describe("assignmentState reducer", () => {
  it("可建立 byId/byTaskId/byPersonIdAndDate 索引", () => {
    const state = buildAssignmentState(assignments);

    expect(Object.keys(state.byId)).toEqual(["a-1", "a-2", "a-3"]);
    expect(state.byTaskId["t-1"].map((item) => item.id)).toEqual([
      "a-1",
      "a-2",
    ]);
    expect(state.byTaskId["t-2"].map((item) => item.id)).toEqual(["a-3"]);

    const key = byPersonIdAndDateKey("p-1", "2026-02-27");
    expect(state.byPersonIdAndDate[key].map((item) => item.id)).toEqual([
      "a-1",
    ]);
  });

  it("可刪除指定 taskIds 的 assignments", () => {
    const state = buildAssignmentState(assignments);
    const nextState = deleteAssignmentsByTaskIds(state, ["t-1"]);

    expect(Object.keys(nextState.byId)).toEqual(["a-3"]);
    expect(nextState.byTaskId["t-1"]).toBeUndefined();
    expect(nextState.byTaskId["t-2"].map((item) => item.id)).toEqual(["a-3"]);
  });

  it("可刪除指定 person 的 assignments", () => {
    const state = buildAssignmentState(assignments);
    const nextState = deleteAssignmentsByPersonId(state, "p-1");

    expect(Object.keys(nextState.byId)).toEqual(["a-2"]);
    expect(nextState.byTaskId["t-1"].map((item) => item.id)).toEqual(["a-2"]);
    expect(nextState.byTaskId["t-2"]).toBeUndefined();
  });
});
