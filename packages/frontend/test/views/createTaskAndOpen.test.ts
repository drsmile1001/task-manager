import { createTaskAndOpen } from "@frontend/views/helpers/createTaskAndOpen";
import { describe, expect, it } from "bun:test";

import type { Task } from "@backend/schemas/Task";

const task: Task = {
  id: "t-1",
  projectId: "p-1",
  milestoneId: null,
  name: "新工作",
  description: "",
  dueDate: null,
  isDone: false,
  isArchived: false,
  labelIds: [],
  assigneeIds: [],
};

describe("createTaskAndOpen", () => {
  it("post 成功後先 setTask 再 pushPanel", async () => {
    const callOrder: string[] = [];

    await createTaskAndOpen({
      task,
      postTask: async () => {
        callOrder.push("post");
      },
      setTask: () => {
        callOrder.push("set");
      },
      pushPanel: () => {
        callOrder.push("push");
      },
    });

    expect(callOrder).toEqual(["post", "set", "push"]);
  });

  it("post 失敗時不會 pushPanel", async () => {
    const callOrder: string[] = [];

    await expect(
      createTaskAndOpen({
        task,
        postTask: async () => {
          callOrder.push("post");
          throw new Error("post failed");
        },
        setTask: () => {
          callOrder.push("set");
        },
        pushPanel: () => {
          callOrder.push("push");
        },
      })
    ).rejects.toThrow("post failed");

    expect(callOrder).toEqual(["post"]);
  });
});
