import { compareProjectByOrderCodeName } from "@frontend/stores/projectSort";
import { describe, expect, it } from "bun:test";

const project = (override: Partial<any>) => ({
  id: "p",
  name: "專案",
  code: "",
  description: "",
  order: null,
  isArchived: false,
  ...override,
});

describe("compareProjectByOrderCodeName", () => {
  it("先比 order（有值優先，數字小在前）", () => {
    const a = project({ id: "a", order: 1, code: "B" });
    const b = project({ id: "b", order: 2, code: "A" });
    expect(compareProjectByOrderCodeName(a, b)).toBeLessThan(0);
  });

  it("order 相同時，code 有值在前，空 code 在後", () => {
    const a = project({ id: "a", order: 1, code: "" });
    const b = project({ id: "b", order: 1, code: "PRJ-1" });
    expect(compareProjectByOrderCodeName(a, b)).toBeGreaterThan(0);
  });

  it("order 相同且都有 code 時，按 code 排序", () => {
    const a = project({ id: "a", order: 1, code: "PRJ-10" });
    const b = project({ id: "b", order: 1, code: "PRJ-2" });
    expect(compareProjectByOrderCodeName(a, b)).toBeLessThan(0);
  });

  it("order/code 相同時，名稱英文優先於中文", () => {
    const a = project({ id: "a", order: 1, code: "X", name: "Alpha" });
    const b = project({ id: "b", order: 1, code: "X", name: "中文專案" });
    expect(compareProjectByOrderCodeName(a, b)).toBeLessThan(0);
  });
});
