import {
  type Assignment,
  assignmentMigrations,
  assignmentSchema,
} from "@backend/schemas/Assignment";
import { type AuditLog, auditLogSchema } from "@backend/schemas/AuditLog";
import { type Label, labelSchema } from "@backend/schemas/Label";
import {
  type Milestone,
  milestoneMigrations,
  milestoneSchema,
} from "@backend/schemas/Milestone";
import {
  type Person,
  personMigrations,
  personSchema,
} from "@backend/schemas/Person";
import { type Planning, planningSchema } from "@backend/schemas/Planning";
import {
  type Project,
  projectMigrations,
  projectSchema,
} from "@backend/schemas/Project";
import { type Session, sessionSchema } from "@backend/schemas/Session";
import { type Task, taskMigrations, taskSchema } from "@backend/schemas/Task";
import { type EntityStore, EntityStoreYaml } from "@drsmile1001/entity-store";
import type { Logger } from "@drsmile1001/logger";

export type AppRepositories = {
  projectRepo: EntityStore<Project>;
  milestoneRepo: EntityStore<Milestone>;
  taskRepo: EntityStore<Task>;
  planningRepo: EntityStore<Planning>;
  assignmentRepo: EntityStore<Assignment>;
  personRepo: EntityStore<Person>;
  labelRepo: EntityStore<Label>;
  sessionRepo: EntityStore<Session>;
  auditLogRepo: EntityStore<AuditLog>;
};

export function createProjectRepo(logger: Logger) {
  return new EntityStoreYaml({
    path: "data/projects.yaml",
    schema: projectSchema,
    logger,
    migrations: projectMigrations,
  });
}

export function createMilestoneRepo(logger: Logger) {
  return new EntityStoreYaml({
    path: "data/milestones.yaml",
    schema: milestoneSchema,
    logger,
    migrations: milestoneMigrations,
  });
}

export function createTaskRepo(logger: Logger) {
  return new EntityStoreYaml({
    path: "data/tasks.yaml",
    schema: taskSchema,
    logger,
    migrations: taskMigrations,
  });
}

export function createPlanningRepo(logger: Logger) {
  return new EntityStoreYaml({
    path: "data/plannings.yaml",
    schema: planningSchema,
    logger,
  });
}

export function createAssignmentRepo(logger: Logger) {
  return new EntityStoreYaml({
    path: "data/assignments.yaml",
    schema: assignmentSchema,
    logger,
    migrations: assignmentMigrations,
  });
}

export function createPersonRepo(logger: Logger) {
  return new EntityStoreYaml({
    path: "data/persons.yaml",
    schema: personSchema,
    logger,
    migrations: personMigrations,
  });
}

export function createLabelRepo(logger: Logger) {
  return new EntityStoreYaml({
    path: "data/labels.yaml",
    schema: labelSchema,
    logger,
  });
}

export function createSessionRepo(logger: Logger) {
  return new EntityStoreYaml({
    path: "data/sessions.yaml",
    schema: sessionSchema,
    logger,
  });
}

export function createAuditLogRepo(logger: Logger) {
  return new EntityStoreYaml({
    path: "data/auditLogs.yaml",
    schema: auditLogSchema,
    logger,
  });
}

export function createRepositories(logger: Logger): AppRepositories {
  return {
    projectRepo: createProjectRepo(logger),
    milestoneRepo: createMilestoneRepo(logger),
    taskRepo: createTaskRepo(logger),
    planningRepo: createPlanningRepo(logger),
    assignmentRepo: createAssignmentRepo(logger),
    personRepo: createPersonRepo(logger),
    labelRepo: createLabelRepo(logger),
    sessionRepo: createSessionRepo(logger),
    auditLogRepo: createAuditLogRepo(logger),
  };
}

export async function initRepositories(repos: AppRepositories) {
  await repos.projectRepo.init();
  await repos.milestoneRepo.init();
  await repos.taskRepo.init();
  await repos.planningRepo.init();
  await repos.assignmentRepo.init();
  await repos.personRepo.init();
  await repos.labelRepo.init();
  await repos.sessionRepo.init();
  await repos.auditLogRepo.init();
}
