import type { TaskAutoArchiveService } from "@backend/services/TaskAutoArchiveService";
import type { Logger } from "@backend/utils/Logger";
import { Cron } from "croner";

const DAY_MS = 24 * 60 * 60 * 1000;

export class AutoArchiveScheduler {
  private job: Cron | null = null;

  constructor(
    private readonly deps: {
      logger: Logger;
      taskAutoArchiveService: TaskAutoArchiveService;
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
    const { days, actorId, taskAutoArchiveService } = this.deps;
    const cutoffMs = Date.now() - days * DAY_MS;
    await taskAutoArchiveService.archiveCompletedTasksBefore(cutoffMs, actorId);
  }

  stop() {
    if (!this.job) {
      return;
    }
    this.job.stop();
    this.job = null;
  }
}
