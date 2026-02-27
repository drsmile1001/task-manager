import { buildApi } from "@backend/api";
import type { Person } from "@backend/schemas/Person";
import { createDefaultLoggerFromEnv } from "@backend/utils/Logger";
import { treaty } from "@elysiajs/eden";
import { describe, expect, test } from "bun:test";

import { FakeMutationPublisher } from "~test/fake/FakeMutationPublisher";
import { createFakeRepositories } from "~test/fake/FakeRepositories";
import { createFakeRequesterResolver } from "~test/fake/FakeRequesterResolver";

const logger = createDefaultLoggerFromEnv();
const requester: Person = {
  id: "person-1",
  name: "Alice",
  email: "alice@example.com",
};

describe("api", () => {
  async function createTestCtx(options?: {
    requester?: Person;
    seed?: Parameters<typeof createFakeRepositories>[0];
  }) {
    const requesterResolver = createFakeRequesterResolver(options?.requester);
    const mutationPublisher = new FakeMutationPublisher(logger);
    const fakeRepos = createFakeRepositories(options?.seed);

    const app = await buildApi({
      logger,
      repos: fakeRepos.repos,
      mutationPublisher,
      requesterResolver,
    });

    const api = treaty(app);
    return {
      api,
      requesterResolver,
      mutationPublisher,
      repos: fakeRepos.inspect,
    };
  }

  test("可在測試中切換當前 requester", async () => {
    const ctx = await createTestCtx();
    ctx.requesterResolver.setRequester({
      id: "person-1",
      name: "Alice",
      email: "alice@example.com",
    });
    const meAsAlice = await ctx.api.api.me.get();
    expect(meAsAlice.data?.id).toBe("person-1");

    ctx.requesterResolver.setRequester({
      id: "person-2",
      name: "Bob",
      email: "bob@example.com",
    });
    const meAsBob = await ctx.api.api.me.get();
    expect(meAsBob.data?.id).toBe("person-2");
    expect(ctx.requesterResolver.resolveCalls.length).toBe(2);
  });

  test("可用 fake repos 與 fake publisher 驗證 API side effects", async () => {
    const ctx = await createTestCtx({
      requester,
      seed: {
        projects: [
          {
            id: "p-1",
            name: "P1",
            code: "P1",
            description: "",
            order: null,
            isArchived: false,
          },
        ],
        tasks: [
          {
            id: "t-1",
            projectId: "p-1",
            milestoneId: null,
            name: "T1",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: [],
            dueDate: null,
            assigneeIds: [],
          },
        ],
      },
    });

    const createAssignmentResult = await ctx.api.api.assignments.post({
      id: "a-1",
      taskId: "t-1",
      personId: requester.id,
      date: "2026-02-27",
      acknowledged: false,
    });

    expect(createAssignmentResult.error).toBeNull();
    expect(ctx.repos.assignmentRepo.get("a-1")?.personId).toBe(requester.id);
    expect(ctx.repos.taskRepo.get("t-1")?.assigneeIds).toEqual([requester.id]);
    expect(
      ctx.mutationPublisher.published.some(
        (log) => log.entityType === "TASK" && log.entityId === "t-1"
      )
    ).toBe(true);
  });

  test("未解析到 requester 時回傳 401", async () => {
    const ctx = await createTestCtx();
    const result = await ctx.api.api.me.get();
    expect(result.error?.status).toBe(401);
  });

  test("刪除 project 會級聯清理 task、assignment、milestone", async () => {
    const ctx = await createTestCtx({
      requester,
      seed: {
        projects: [
          {
            id: "p-1",
            name: "P1",
            code: "P1",
            description: "",
            order: null,
            isArchived: false,
          },
          {
            id: "p-2",
            name: "P2",
            code: "P2",
            description: "",
            order: null,
            isArchived: false,
          },
        ],
        milestones: [
          {
            id: "m-1",
            projectId: "p-1",
            name: "M1",
            description: "",
            dueDate: null,
            isArchived: false,
          },
          {
            id: "m-2",
            projectId: "p-2",
            name: "M2",
            description: "",
            dueDate: null,
            isArchived: false,
          },
        ],
        tasks: [
          {
            id: "t-1",
            projectId: "p-1",
            milestoneId: "m-1",
            name: "T1",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: [],
            dueDate: null,
            assigneeIds: [],
          },
          {
            id: "t-2",
            projectId: "p-2",
            milestoneId: "m-2",
            name: "T2",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: [],
            dueDate: null,
            assigneeIds: [],
          },
        ],
        assignments: [
          {
            id: "a-1",
            taskId: "t-1",
            personId: requester.id,
            date: "2026-02-27",
            acknowledged: false,
          },
          {
            id: "a-2",
            taskId: "t-2",
            personId: requester.id,
            date: "2026-02-27",
            acknowledged: false,
          },
        ],
        plannings: [
          {
            id: "pl-1",
            taskId: "t-1",
            weekStartDate: "2026-02-23",
          },
          {
            id: "pl-2",
            taskId: "t-2",
            weekStartDate: "2026-02-23",
          },
        ],
      },
    });

    const result = await ctx.api.api.projects({ id: "p-1" }).delete();
    expect(result.error).toBeNull();

    expect(ctx.repos.projectRepo.get("p-1")).toBeUndefined();
    expect(ctx.repos.taskRepo.get("t-1")).toBeUndefined();
    expect(ctx.repos.assignmentRepo.get("a-1")).toBeUndefined();
    expect(ctx.repos.planningRepo.get("pl-1")).toBeUndefined();
    expect(ctx.repos.milestoneRepo.get("m-1")).toBeUndefined();

    expect(ctx.repos.projectRepo.get("p-2")?.id).toBe("p-2");
    expect(ctx.repos.taskRepo.get("t-2")?.id).toBe("t-2");
    expect(ctx.repos.assignmentRepo.get("a-2")?.id).toBe("a-2");
    expect(ctx.repos.planningRepo.get("pl-2")?.id).toBe("pl-2");
    expect(ctx.repos.milestoneRepo.get("m-2")?.id).toBe("m-2");
  });

  test("更新 milestone dueDate 會同步更新底下 task dueDate", async () => {
    const ctx = await createTestCtx({
      requester,
      seed: {
        milestones: [
          {
            id: "m-1",
            projectId: "p-1",
            name: "M1",
            description: "",
            dueDate: null,
            isArchived: false,
          },
        ],
        tasks: [
          {
            id: "t-1",
            projectId: "p-1",
            milestoneId: "m-1",
            name: "T1",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: [],
            dueDate: null,
            assigneeIds: [],
          },
          {
            id: "t-2",
            projectId: "p-1",
            milestoneId: null,
            name: "T2",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: [],
            dueDate: null,
            assigneeIds: [],
          },
        ],
      },
    });

    const result = await ctx.api.api.milestones({ id: "m-1" }).patch({
      dueDate: "2026-03-01",
    });
    expect(result.error).toBeNull();
    expect(new Date(result.data?.dueDate as string).toISOString()).toBe(
      "2026-03-01T00:00:00.000Z"
    );
    expect(
      new Date(ctx.repos.taskRepo.get("t-1")?.dueDate as string).toISOString()
    ).toBe("2026-03-01T00:00:00.000Z");
    expect(ctx.repos.taskRepo.get("t-2")?.dueDate).toBeNull();
    expect(
      ctx.mutationPublisher.published.some(
        (log) =>
          log.entityType === "TASK" &&
          log.entityId === "t-1" &&
          log.action === "UPDATE"
      )
    ).toBe(true);
  });

  test("刪除 milestone 會把相關 task 的 milestoneId 清空", async () => {
    const ctx = await createTestCtx({
      requester,
      seed: {
        milestones: [
          {
            id: "m-1",
            projectId: "p-1",
            name: "M1",
            description: "",
            dueDate: null,
            isArchived: false,
          },
        ],
        tasks: [
          {
            id: "t-1",
            projectId: "p-1",
            milestoneId: "m-1",
            name: "T1",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: [],
            dueDate: null,
            assigneeIds: [],
          },
        ],
      },
    });

    const result = await ctx.api.api.milestones({ id: "m-1" }).delete();
    expect(result.error).toBeNull();
    expect(ctx.repos.milestoneRepo.get("m-1")).toBeUndefined();
    expect(ctx.repos.taskRepo.get("t-1")?.milestoneId).toBeNull();
    expect(
      ctx.mutationPublisher.published.some(
        (log) =>
          log.entityType === "TASK" &&
          log.entityId === "t-1" &&
          log.action === "UPDATE"
      )
    ).toBe(true);
  });

  test("刪除 task 會同步刪除該 task 的 assignments", async () => {
    const ctx = await createTestCtx({
      requester,
      seed: {
        tasks: [
          {
            id: "t-1",
            projectId: "p-1",
            milestoneId: null,
            name: "T1",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: [],
            dueDate: null,
            assigneeIds: [],
          },
          {
            id: "t-2",
            projectId: "p-1",
            milestoneId: null,
            name: "T2",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: [],
            dueDate: null,
            assigneeIds: [],
          },
        ],
        assignments: [
          {
            id: "a-1",
            taskId: "t-1",
            personId: requester.id,
            date: "2026-02-27",
            acknowledged: false,
          },
          {
            id: "a-2",
            taskId: "t-2",
            personId: requester.id,
            date: "2026-02-27",
            acknowledged: false,
          },
        ],
        plannings: [
          {
            id: "pl-1",
            taskId: "t-1",
            weekStartDate: "2026-02-23",
          },
          {
            id: "pl-2",
            taskId: "t-2",
            weekStartDate: "2026-02-23",
          },
        ],
      },
    });

    const result = await ctx.api.api.tasks({ id: "t-1" }).delete();
    expect(result.error).toBeNull();
    expect(ctx.repos.taskRepo.get("t-1")).toBeUndefined();
    expect(ctx.repos.assignmentRepo.get("a-1")).toBeUndefined();
    expect(ctx.repos.planningRepo.get("pl-1")).toBeUndefined();
    expect(ctx.repos.assignmentRepo.get("a-2")?.id).toBe("a-2");
    expect(ctx.repos.planningRepo.get("pl-2")?.id).toBe("pl-2");
  });

  test("刪除 label 會從 task labelIds 移除該 label", async () => {
    const ctx = await createTestCtx({
      requester,
      seed: {
        labels: [
          {
            id: "l-1",
            name: "L1",
            color: "#777777",
            priority: null,
          },
        ],
        tasks: [
          {
            id: "t-1",
            projectId: "p-1",
            milestoneId: null,
            name: "T1",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: ["l-1", "l-2"],
            dueDate: null,
            assigneeIds: [],
          },
        ],
      },
    });

    const result = await ctx.api.api.labels({ id: "l-1" }).delete();
    expect(result.error).toBeNull();
    expect(ctx.repos.labelRepo.get("l-1")).toBeUndefined();
    expect(ctx.repos.taskRepo.get("t-1")?.labelIds).toEqual(["l-2"]);
  });

  test("刪除 person 會刪除該 person 的 assignments", async () => {
    const ctx = await createTestCtx({
      requester,
      seed: {
        persons: [
          {
            id: "person-a",
            name: "A",
            email: "a@example.com",
            order: null,
          },
          {
            id: "person-b",
            name: "B",
            email: "b@example.com",
            order: null,
          },
        ],
        assignments: [
          {
            id: "a-1",
            taskId: "t-1",
            personId: "person-a",
            date: "2026-02-27",
            acknowledged: false,
          },
          {
            id: "a-2",
            taskId: "t-1",
            personId: "person-b",
            date: "2026-02-27",
            acknowledged: false,
          },
        ],
      },
    });

    const result = await ctx.api.api.persons({ id: "person-a" }).delete();
    expect(result.error).toBeNull();
    expect(ctx.repos.personRepo.get("person-a")).toBeUndefined();
    expect(ctx.repos.assignmentRepo.get("a-1")).toBeUndefined();
    expect(ctx.repos.assignmentRepo.get("a-2")?.id).toBe("a-2");
  });

  test("建立 task 時會自動補上 requester 到 assigneeIds", async () => {
    const ctx = await createTestCtx({
      requester,
      seed: {
        projects: [
          {
            id: "p-1",
            name: "P1",
            code: "P1",
            description: "",
            order: null,
            isArchived: false,
          },
        ],
      },
    });

    const result = await ctx.api.api.tasks.post({
      id: "t-1",
      projectId: "p-1",
      milestoneId: null,
      name: "T1",
      description: "",
      dueDate: null,
      isDone: false,
      isArchived: false,
      labelIds: [],
      assigneeIds: [],
    });

    expect(result.error).toBeNull();
    expect(result.data?.assigneeIds).toEqual([requester.id]);
    expect(ctx.repos.taskRepo.get("t-1")?.assigneeIds).toEqual([requester.id]);
  });

  test("更新 assignment personId 時只補上新 assignee，不移除舊 assignee", async () => {
    const ctx = await createTestCtx({
      requester,
      seed: {
        tasks: [
          {
            id: "t-1",
            projectId: "p-1",
            milestoneId: null,
            name: "T1",
            description: "",
            isDone: false,
            completedAt: null,
            isArchived: false,
            labelIds: [],
            dueDate: null,
            assigneeIds: ["person-a"],
          },
        ],
        assignments: [
          {
            id: "a-1",
            taskId: "t-1",
            personId: "person-a",
            date: "2026-02-27",
            acknowledged: false,
          },
        ],
      },
    });

    const result = await ctx.api.api.assignments({ id: "a-1" }).patch({
      personId: "person-b",
    });

    expect(result.error).toBeNull();
    expect(ctx.repos.taskRepo.get("t-1")?.assigneeIds).toEqual([
      "person-a",
      "person-b",
    ]);
    expect(
      ctx.mutationPublisher.published.some(
        (log) =>
          log.entityType === "TASK" &&
          log.entityId === "t-1" &&
          log.action === "UPDATE"
      )
    ).toBe(true);
  });
});
