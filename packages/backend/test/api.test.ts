import { buildApi } from "@backend/api";
import type { Person } from "@backend/schemas/Person";
import { createDefaultLoggerFromEnv } from "@backend/utils/Logger";
import { treaty } from "@elysiajs/eden";
import { describe, expect, test } from "bun:test";

import { FakeMutationPublisher } from "~test/fake/FakeMutationPublisher";
import { createFakeRepositories } from "~test/fake/FakeRepositories";
import { createFakeRequesterResolver } from "~test/fake/FakeRequesterResolver";

const logger = createDefaultLoggerFromEnv();

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
    const requester: Person = {
      id: "person-1",
      name: "Alice",
      email: "alice@example.com",
    };
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
});
