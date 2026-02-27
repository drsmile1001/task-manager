import {
  SYSTEM_USER_IDS,
  getSystemUserById,
} from "@backend/constants/SystemUsers";
import type { Person } from "@backend/schemas/Person";
import type { Session } from "@backend/schemas/Session";
import type { YamlRepo } from "@backend/utils/YamlRepo";

export type RequesterResolveContext = {
  apiKey?: string;
  sessionId?: string;
};

export interface RequesterResolver {
  resolve(ctx: RequesterResolveContext): Promise<Person | undefined>;
}

export class RequesterResolverDefault implements RequesterResolver {
  constructor(
    private readonly deps: {
      personRepo: YamlRepo<Person>;
      sessionRepo: YamlRepo<Session>;
    }
  ) {}

  async resolve(ctx: RequesterResolveContext): Promise<Person | undefined> {
    if (ctx.apiKey && ctx.apiKey === Bun.env.API_KEY) {
      const apiKeyUser = getSystemUserById(SYSTEM_USER_IDS.API_KEY);
      return {
        id: SYSTEM_USER_IDS.API_KEY,
        name: apiKeyUser?.name ?? "API Key",
        email: "apikey@local",
      };
    }

    if (!ctx.sessionId) {
      return undefined;
    }

    const session = this.deps.sessionRepo.get(ctx.sessionId);
    if (!session) {
      return undefined;
    }

    if (session.expiresAt < Date.now()) {
      await this.deps.sessionRepo.remove(ctx.sessionId);
      return undefined;
    }

    return this.deps.personRepo.get(session.personId);
  }
}
