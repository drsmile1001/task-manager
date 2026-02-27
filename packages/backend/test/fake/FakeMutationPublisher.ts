import type { AuditLog } from "@backend/schemas/AuditLog";
import { MutationPublisherService } from "@backend/services/MutationPublisher";
import type { Logger } from "@backend/utils/Logger";

export class FakeMutationPublisher extends MutationPublisherService {
  readonly published: AuditLog[] = [];

  constructor(logger: Logger) {
    super(logger);
  }

  override publish(message: AuditLog) {
    this.published.push(message);
  }
}
