import type { AuditLog } from "@backend/schemas/AuditLog";
import type { Task } from "@backend/schemas/Task";
import type { MutationPublisherService } from "@backend/services/MutationPublisher";
import type { AppRepositories } from "@backend/services/Repositories";
import type { Logger } from "@drsmile1001/logger";
import { ulid } from "ulid";

export class TaskAutoArchiveService {
  constructor(
    private readonly deps: {
      logger: Logger;
      repos: Pick<AppRepositories, "taskRepo" | "auditLogRepo">;
      mutationPublisher: MutationPublisherService;
    }
  ) {}

  async archiveCompletedTasksBefore(cutoffMs: number, actorId: string) {
    const { logger, repos, mutationPublisher } = this.deps;
    const tasks = repos.taskRepo.list();
    const targets = tasks.filter(
      (task) =>
        task.isDone &&
        !task.isArchived &&
        task.completedAt !== null &&
        task.completedAt <= cutoffMs
    );

    for (const task of targets) {
      const updated: Task = {
        ...task,
        isArchived: true,
      };
      await repos.taskRepo.set(updated);
      const auditLog: AuditLog = {
        id: ulid(),
        timestamp: Date.now(),
        userId: actorId,
        action: "UPDATE",
        entityType: "TASK",
        entityId: task.id,
        changes: {
          before: task,
          after: updated,
        },
      };
      await repos.auditLogRepo.set(auditLog);
      mutationPublisher.publish(auditLog);
    }

    logger.info(
      {
        type: "autoArchive",
        cutoffMs,
        archivedCount: targets.length,
      },
      `Auto archive completed: ${targets.length}`
    );

    return targets.length;
  }
}
