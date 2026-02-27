import type { AuditLog } from "@backend/schemas/AuditLog";
import type { Task } from "@backend/schemas/Task";
import { MutationPublisherService } from "@backend/services/MutationPublisher";
import { TaskAutoArchiveService } from "@backend/services/TaskAutoArchiveService";
import { createDefaultLoggerFromEnv } from "@backend/utils/Logger";
import { expect, test } from "bun:test";

import { createInMemoryRepo } from "~test/helpers/InMemoryRepo";

class TestMutationPublisherService extends MutationPublisherService {
  published: AuditLog[] = [];

  override publish(message: AuditLog) {
    this.published.push(message);
  }
}

test("可封存 7 天前完成且尚未封存的 task", async () => {
  const logger = createDefaultLoggerFromEnv();
  const now = Date.now();
  const cutoffMs = now - 7 * 24 * 60 * 60 * 1000;
  const tasks: Task[] = [
    {
      id: "t-1",
      projectId: "p-1",
      milestoneId: null,
      name: "應被封存",
      description: "",
      isDone: true,
      completedAt: cutoffMs - 1,
      isArchived: false,
      labelIds: [],
      dueDate: null,
      assigneeIds: [],
    },
    {
      id: "t-2",
      projectId: "p-1",
      milestoneId: null,
      name: "尚未達 7 天",
      description: "",
      isDone: true,
      completedAt: cutoffMs + 1,
      isArchived: false,
      labelIds: [],
      dueDate: null,
      assigneeIds: [],
    },
    {
      id: "t-3",
      projectId: "p-1",
      milestoneId: null,
      name: "未完成",
      description: "",
      isDone: false,
      completedAt: null,
      isArchived: false,
      labelIds: [],
      dueDate: null,
      assigneeIds: [],
    },
  ];

  const taskRepo = createInMemoryRepo(tasks);
  const auditLogRepo = createInMemoryRepo<AuditLog>([]);
  const mutationPublisher = new TestMutationPublisherService(logger);
  const service = new TaskAutoArchiveService({
    logger,
    repos: { taskRepo, auditLogRepo },
    mutationPublisher,
  });

  const archivedCount = await service.archiveCompletedTasksBefore(
    cutoffMs,
    "system-auto-archive"
  );

  expect(archivedCount).toBe(1);
  expect(taskRepo.get("t-1")?.isArchived).toBe(true);
  expect(taskRepo.get("t-2")?.isArchived).toBe(false);
  expect(taskRepo.get("t-3")?.isArchived).toBe(false);
  expect(auditLogRepo.list().length).toBe(1);
  expect(mutationPublisher.published.length).toBe(1);
});
