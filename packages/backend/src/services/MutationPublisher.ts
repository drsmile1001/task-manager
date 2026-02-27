import type { AuditLog } from "@backend/schemas/AuditLog";
import type { Logger } from "@backend/utils/Logger";

export type MutationTopic = {
  topic: "mutations";
} & AuditLog;

export class MutationPublisherService {
  private server: Bun.Server<unknown> | null = null;

  constructor(private readonly logger: Logger) {}

  setServer(server: Bun.Server<unknown>) {
    this.server = server;
  }

  publish(message: AuditLog) {
    this.logger.info(
      {
        type: "broadcastMutation",
        message,
      },
      `Broadcasting mutation: ${message.entityType} ${message.action} ${message.entityId}`
    );
    this.server?.publish(
      "mutations",
      JSON.stringify({
        topic: "mutations",
        ...message,
      })
    );
  }
}
