import type { AuditLog } from "@backend/schemas/AuditLog";
import type { Milestone } from "@backend/schemas/Milestone";
import type { MutationPublisherService } from "@backend/services/MutationPublisher";
import type { AppRepositories } from "@backend/services/Repositories";
import type { Logger } from "@backend/utils/Logger";
import { ulid } from "ulid";

export class MilestoneAutoArchiveService {
  constructor(
    private readonly deps: {
      logger: Logger;
      repos: Pick<AppRepositories, "milestoneRepo" | "auditLogRepo">;
      mutationPublisher: MutationPublisherService;
    }
  ) {}

  async archiveByDueDateBefore(cutoffDate: string, actorId: string) {
    const { logger, repos, mutationPublisher } = this.deps;
    const milestones = repos.milestoneRepo.list();
    const targets = milestones.filter(
      (milestone) =>
        !milestone.isArchived &&
        milestone.dueDate !== null &&
        milestone.dueDate <= cutoffDate
    );

    for (const milestone of targets) {
      const updated: Milestone = {
        ...milestone,
        isArchived: true,
      };
      await repos.milestoneRepo.set(updated);

      const auditLog: AuditLog = {
        id: ulid(),
        timestamp: Date.now(),
        userId: actorId,
        action: "UPDATE",
        entityType: "MILESTONE",
        entityId: milestone.id,
        changes: {
          before: milestone,
          after: updated,
        },
      };

      await repos.auditLogRepo.set(auditLog);
      mutationPublisher.publish(auditLog);
    }

    logger.info(
      {
        type: "autoArchiveMilestone",
        cutoffDate,
        archivedCount: targets.length,
      },
      `Auto archive milestone completed: ${targets.length}`
    );

    return targets.length;
  }
}
