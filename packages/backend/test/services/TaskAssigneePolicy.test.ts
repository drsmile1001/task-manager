import { SYSTEM_USER_IDS } from "@backend/constants/SystemUsers";
import { applyTaskCreateAssigneePolicy } from "@backend/services/TaskAssigneePolicy";
import { expect, test } from "bun:test";

test("建立 task 時會自動加入一般 requester", () => {
  const assigneeIds = applyTaskCreateAssigneePolicy({
    assigneeIds: ["person-a"],
    requesterId: "person-b",
  });

  expect(assigneeIds).toEqual(["person-a", "person-b"]);
});

test("建立 task 時若 requester 已在名單中不重複加入", () => {
  const assigneeIds = applyTaskCreateAssigneePolicy({
    assigneeIds: ["person-a", "person-b"],
    requesterId: "person-b",
  });

  expect(assigneeIds).toEqual(["person-a", "person-b"]);
});

test("建立 task 時不自動加入系統使用者 requester", () => {
  const assigneeIds = applyTaskCreateAssigneePolicy({
    assigneeIds: ["person-a"],
    requesterId: SYSTEM_USER_IDS.API_KEY,
  });

  expect(assigneeIds).toEqual(["person-a"]);
});
