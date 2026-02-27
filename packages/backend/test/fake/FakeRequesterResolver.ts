import type { Person } from "@backend/schemas/Person";
import type {
  RequesterResolveContext,
  RequesterResolver,
} from "@backend/services/RequesterResolver";

export class FakeRequesterResolver implements RequesterResolver {
  private requester: Person | undefined;
  readonly resolveCalls: RequesterResolveContext[] = [];

  constructor(initialRequester?: Person) {
    this.requester = initialRequester;
  }

  setRequester(requester: Person | undefined) {
    this.requester = requester;
  }

  async resolve(ctx: RequesterResolveContext): Promise<Person | undefined> {
    this.resolveCalls.push(ctx);
    return this.requester;
  }
}

export function createFakeRequesterResolver(initialRequester?: Person) {
  return new FakeRequesterResolver(initialRequester);
}
