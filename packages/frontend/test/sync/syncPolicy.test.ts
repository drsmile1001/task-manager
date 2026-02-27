import {
  isMutationMethod,
  shouldBlockMutationRequest,
  shouldBypassSyncGuard,
} from "@frontend/syncPolicy";
import { describe, expect, it } from "bun:test";

describe("syncPolicy", () => {
  it("可判斷 mutation method", () => {
    expect(isMutationMethod("POST")).toBeTrue();
    expect(isMutationMethod("PATCH")).toBeTrue();
    expect(isMutationMethod("DELETE")).toBeTrue();
    expect(isMutationMethod("GET")).toBeFalse();
  });

  it("允許 login/logout 跳過同步守門", () => {
    expect(shouldBypassSyncGuard("/api/login")).toBeTrue();
    expect(shouldBypassSyncGuard("/api/logout")).toBeTrue();
    expect(shouldBypassSyncGuard("/task-manager/api/login")).toBeTrue();
    expect(shouldBypassSyncGuard("/api/tasks")).toBeFalse();
  });

  it("在未連線時會阻擋 mutation", () => {
    expect(
      shouldBlockMutationRequest({
        method: "POST",
        pathname: "/api/tasks",
        isSyncWritable: false,
      })
    ).toBeTrue();
  });

  it("在已連線時允許 mutation", () => {
    expect(
      shouldBlockMutationRequest({
        method: "POST",
        pathname: "/api/tasks",
        isSyncWritable: true,
      })
    ).toBeFalse();
  });

  it("GET request 不受同步守門影響", () => {
    expect(
      shouldBlockMutationRequest({
        method: "GET",
        pathname: "/api/tasks",
        isSyncWritable: false,
      })
    ).toBeFalse();
  });
});
