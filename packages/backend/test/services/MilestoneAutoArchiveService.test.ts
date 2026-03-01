import { SYSTEM_USER_IDS } from "@backend/constants/SystemUsers";
import type { AuditLog } from "@backend/schemas/AuditLog";
import type { Milestone } from "@backend/schemas/Milestone";
import { MilestoneAutoArchiveService } from "@backend/services/MilestoneAutoArchiveService";
import { MutationPublisherService } from "@backend/services/MutationPublisher";
import { createDefaultLoggerFromEnv } from "@drsmile1001/logger";
import { expect, test } from "bun:test";

import { createInMemoryRepo } from "~test/helpers/InMemoryRepo";

class TestMutationPublisherService extends MutationPublisherService {
  published: AuditLog[] = [];

  override publish(message: AuditLog) {
    this.published.push(message);
  }
}

test("可封存 7 天前到期且尚未封存的里程碑", async () => {
  const logger = createDefaultLoggerFromEnv();
  const milestones: Milestone[] = [
    {
      id: "m-1",
      projectId: "p-1",
      name: "應被封存",
      description: "",
      dueDate: "2026-02-01",
      isArchived: false,
    },
    {
      id: "m-2",
      projectId: "p-1",
      name: "尚未到期",
      description: "",
      dueDate: "2026-02-10",
      isArchived: false,
    },
    {
      id: "m-3",
      projectId: "p-1",
      name: "無到期日",
      description: "",
      dueDate: null,
      isArchived: false,
    },
  ];

  const milestoneRepo = createInMemoryRepo(milestones);
  const auditLogRepo = createInMemoryRepo<AuditLog>([]);
  const mutationPublisher = new TestMutationPublisherService(logger);
  const service = new MilestoneAutoArchiveService({
    logger,
    repos: { milestoneRepo, auditLogRepo },
    mutationPublisher,
  });

  const archivedCount = await service.archiveByDueDateBefore(
    "2026-02-03",
    SYSTEM_USER_IDS.AUTO_ARCHIVE
  );

  expect(archivedCount).toBe(1);
  expect(milestoneRepo.get("m-1")?.isArchived).toBe(true);
  expect(milestoneRepo.get("m-2")?.isArchived).toBe(false);
  expect(milestoneRepo.get("m-3")?.isArchived).toBe(false);
  expect(auditLogRepo.list().length).toBe(1);
  expect(mutationPublisher.published.length).toBe(1);
});
