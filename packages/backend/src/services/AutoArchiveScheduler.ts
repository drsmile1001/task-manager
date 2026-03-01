import type { MilestoneAutoArchiveService } from "@backend/services/MilestoneAutoArchiveService";
import type { TaskAutoArchiveService } from "@backend/services/TaskAutoArchiveService";
import type { Logger } from "@drsmile1001/logger";
import { Cron } from "croner";

const DAY_MS = 24 * 60 * 60 * 1000;

export class AutoArchiveScheduler {
  private job: Cron | null = null;

  constructor(
    private readonly deps: {
      logger: Logger;
      taskAutoArchiveService: TaskAutoArchiveService;
      milestoneAutoArchiveService: MilestoneAutoArchiveService;
      enabled: boolean;
      days: number;
      timezone: string;
      actorId: string;
    }
  ) {}

  start() {
    const { enabled, logger, timezone } = this.deps;
    if (!enabled) {
      logger.info({ type: "autoArchive" }, "Auto archive scheduler disabled");
      return;
    }
    this.job = new Cron(
      "0 0 * * *",
      {
        timezone,
      },
      async () => {
        await this.runOnce();
      }
    );
    logger.info(
      { type: "autoArchive", timezone },
      "Auto archive scheduler started"
    );
  }

  async runOnce() {
    const {
      days,
      actorId,
      timezone,
      taskAutoArchiveService,
      milestoneAutoArchiveService,
    } = this.deps;
    const cutoffMs = Date.now() - days * DAY_MS;
    const cutoffDate = formatDateInTimezone(cutoffMs, timezone);
    await taskAutoArchiveService.archiveCompletedTasksBefore(cutoffMs, actorId);
    await milestoneAutoArchiveService.archiveByDueDateBefore(
      cutoffDate,
      actorId
    );
  }

  stop() {
    if (!this.job) {
      return;
    }
    this.job.stop();
    this.job = null;
  }
}

function formatDateInTimezone(timeMs: number, timezone: string) {
  const date = new Date(timeMs);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}
