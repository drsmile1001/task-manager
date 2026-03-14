import type { Assignment } from "@backend/schemas/Assignment";
import type { AuditLog } from "@backend/schemas/AuditLog";
import type { Label } from "@backend/schemas/Label";
import type { Milestone } from "@backend/schemas/Milestone";
import type { Person } from "@backend/schemas/Person";
import type { Planning } from "@backend/schemas/Planning";
import type { Project } from "@backend/schemas/Project";
import type { Session } from "@backend/schemas/Session";
import type { Task } from "@backend/schemas/Task";
import type { AppRepositories } from "@backend/services/Repositories";
import {
  type EntityStore,
  EntityStoreInMemory,
} from "@drsmile1001/entity-store";

type RepoSeed = {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  plannings: Planning[];
  assignments: Assignment[];
  persons: Person[];
  labels: Label[];
  sessions: Session[];
  auditLogs: AuditLog[];
};

type RepoCalls<T> = {
  set: T[];
  remove: string[];
  replaceAll: T[][];
};

export type FakeRepo<T extends { id: string }> = EntityStore<T> & {
  calls: RepoCalls<T>;
};

function createTrackedRepo<T extends { id: string }>(
  initialData: T[]
): FakeRepo<T> {
  const base = new EntityStoreInMemory({
    initialItems: initialData,
  });
  const calls: RepoCalls<T> = {
    set: [],
    remove: [],
    replaceAll: [],
  };

  return {
    async init() {
      await base.init();
    },
    list() {
      return base.list();
    },
    get(id: string) {
      return base.get(id);
    },
    async set(item: T) {
      calls.set.push(item);
      await base.set(item);
    },
    async remove(id: string) {
      calls.remove.push(id);
      await base.remove(id);
    },
    async replaceAll(data: T[]) {
      calls.replaceAll.push([...data]);
      await base.replaceAll(data);
    },
    calls,
  };
}

export function createFakeRepositories(seed: Partial<RepoSeed> = {}) {
  const projectRepo = createTrackedRepo<Project>(seed.projects ?? []);
  const milestoneRepo = createTrackedRepo<Milestone>(seed.milestones ?? []);
  const taskRepo = createTrackedRepo<Task>(seed.tasks ?? []);
  const planningRepo = createTrackedRepo<Planning>(seed.plannings ?? []);
  const assignmentRepo = createTrackedRepo<Assignment>(seed.assignments ?? []);
  const personRepo = createTrackedRepo<Person>(seed.persons ?? []);
  const labelRepo = createTrackedRepo<Label>(seed.labels ?? []);
  const sessionRepo = createTrackedRepo<Session>(seed.sessions ?? []);
  const auditLogRepo = createTrackedRepo<AuditLog>(seed.auditLogs ?? []);

  const repos: AppRepositories = {
    projectRepo,
    milestoneRepo,
    taskRepo,
    planningRepo,
    assignmentRepo,
    personRepo,
    labelRepo,
    sessionRepo,
    auditLogRepo,
  };

  return {
    repos,
    inspect: {
      projectRepo,
      milestoneRepo,
      taskRepo,
      planningRepo,
      assignmentRepo,
      personRepo,
      labelRepo,
      sessionRepo,
      auditLogRepo,
    },
  };
}
