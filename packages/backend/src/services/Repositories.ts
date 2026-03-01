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
import type { YamlRepo } from "@backend/utils/YamlRepo";
import { createYamlRepo } from "@backend/utils/YamlRepo";
import type { Logger } from "@drsmile1001/logger";

export type AppRepositories = {
  projectRepo: YamlRepo<Project>;
  milestoneRepo: YamlRepo<Milestone>;
  taskRepo: YamlRepo<Task>;
  planningRepo: YamlRepo<Planning>;
  assignmentRepo: YamlRepo<Assignment>;
  personRepo: YamlRepo<Person>;
  labelRepo: YamlRepo<Label>;
  sessionRepo: YamlRepo<Session>;
  auditLogRepo: YamlRepo<AuditLog>;
};

export function createProjectRepo(logger: Logger) {
  return createYamlRepo(
    "data/projects.yaml",
    projectSchema,
    logger,
    projectMigrations
  );
}

export function createMilestoneRepo(logger: Logger) {
  return createYamlRepo(
    "data/milestones.yaml",
    milestoneSchema,
    logger,
    milestoneMigrations
  );
}

export function createTaskRepo(logger: Logger) {
  return createYamlRepo("data/tasks.yaml", taskSchema, logger, taskMigrations);
}

export function createPlanningRepo(logger: Logger) {
  return createYamlRepo("data/plannings.yaml", planningSchema, logger);
}

export function createAssignmentRepo(logger: Logger) {
  return createYamlRepo(
    "data/assignments.yaml",
    assignmentSchema,
    logger,
    assignmentMigrations
  );
}

export function createPersonRepo(logger: Logger) {
  return createYamlRepo(
    "data/persons.yaml",
    personSchema,
    logger,
    personMigrations
  );
}

export function createLabelRepo(logger: Logger) {
  return createYamlRepo("data/labels.yaml", labelSchema, logger);
}

export function createSessionRepo(logger: Logger) {
  return createYamlRepo("data/sessions.yaml", sessionSchema, logger);
}

export function createAuditLogRepo(logger: Logger) {
  return createYamlRepo("data/auditLogs.yaml", auditLogSchema, logger);
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
