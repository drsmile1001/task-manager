import Elysia, { t } from "elysia";
import { createYamlRepo } from "./utils/YamlRepo";
import { projectMigrations, projectSchema } from "./schemas/Project";
import { taskMigrations, taskSchema } from "./schemas/Task";
import { assignmentSchema } from "./schemas/Assignment";
import type { Logger } from "~shared/Logger";
import { personMigrations, personSchema } from "./schemas/Person";
import { labelSchema } from "./schemas/Label";
import { milestoneMigrations, milestoneSchema } from "./schemas/Milestone";
import { planningSchema } from "./schemas/Planning";
import { jwtDecode } from "jwt-decode";
import { sessionSchema } from "./schemas/Session";
import { ulid } from "ulid";
import { addDays } from "date-fns";
import {
  auditLogSchema,
  type ActionType,
  type AuditLog,
  type EntityType,
} from "./schemas/AuditLog";

let currentBunServer: Bun.Server<unknown> | null = null;

export type MutationTopic = {
  topic: "mutations";
} & AuditLog;

export function setCurrentBunServerPublish(server: Bun.Server<unknown>) {
  currentBunServer = server;
}

export async function buildApi(logger: Logger) {
  const projectRepo = createYamlRepo(
    "data/projects.yaml",
    projectSchema,
    logger,
    projectMigrations
  );
  await projectRepo.init();
  const milestoneRepo = createYamlRepo(
    "data/milestones.yaml",
    milestoneSchema,
    logger,
    milestoneMigrations
  );
  await milestoneRepo.init();

  const taskRepo = createYamlRepo(
    "data/tasks.yaml",
    taskSchema,
    logger,
    taskMigrations
  );
  await taskRepo.init();
  const planningRepo = createYamlRepo(
    "data/plannings.yaml",
    planningSchema,
    logger
  );
  await planningRepo.init();
  const assignmentRepo = createYamlRepo(
    "data/assignments.yaml",
    assignmentSchema,
    logger
  );
  await assignmentRepo.init();
  const personRepo = createYamlRepo(
    "data/persons.yaml",
    personSchema,
    logger,
    personMigrations
  );
  await personRepo.init();
  const labelRepo = createYamlRepo("data/labels.yaml", labelSchema, logger);
  await labelRepo.init();
  const sessionRepo = createYamlRepo(
    "data/sessions.yaml",
    sessionSchema,
    logger
  );
  await sessionRepo.init();

  const auditLogRepo = createYamlRepo(
    "data/auditLogs.yaml",
    auditLogSchema,
    logger
  );
  await auditLogRepo.init();

  function broadcastMutation(message: AuditLog) {
    logger.info(
      {
        type: "broadcastMutation",
        message,
      },
      `Broadcasting mutation: ${message.entityType} ${message.action} ${message.entityId}`
    );
    currentBunServer?.publish(
      "mutations",
      JSON.stringify({
        topic: "mutations",
        ...message,
      })
    );
  }
  const sessionCookieKey = "task-manager-session-id";

  const api = new Elysia()
    .post(
      "/api/login",
      async ({ body, cookie }) => {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: body.code,
            client_id: Bun.env.GOOGLE_CLIENT_ID || "",
            client_secret: Bun.env.GOOGLE_CLIENT_SECRET || "",
            redirect_uri: body.redirect_uri,
            grant_type: "authorization_code",
          }),
        });
        const data = await response.json();
        const idToken = data.id_token;
        const userInfo = jwtDecode<{ email: string; name: string }>(idToken);

        let person = personRepo.list().find((p) => p.email === userInfo.email);
        if (!person) {
          person = {
            id: ulid(),
            name: userInfo.name,
            email: userInfo.email,
          };
          await personRepo.set(person);

          const auditLog: AuditLog = {
            id: ulid(),
            timestamp: Date.now(),
            userId: person!.id,
            action: "CREATE",
            entityType: "PERSON",
            entityId: person.id,
            changes: {
              after: person,
            },
          };
          await auditLogRepo.set(auditLog);
          broadcastMutation(auditLog);
        }

        const sessionId = crypto.randomUUID();
        const now = Date.now();
        const expiresAt = addDays(now, 30);
        await sessionRepo.set({
          id: sessionId,
          personId: person.id,
          createdAt: now.valueOf(),
          expiresAt: expiresAt.valueOf(),
        });

        cookie[sessionCookieKey].set({
          value: sessionId,
          httpOnly: true,
          expires: new Date(expiresAt),
          maxAge: 30 * 24 * 60 * 60,
        });

        return person;
      },
      {
        body: t.Object({
          code: t.String(),
          redirect_uri: t.String(),
        }),
      }
    )
    .post("/api/logout", async ({ cookie }) => {
      const sessionId = cookie[sessionCookieKey]?.value as string | undefined;
      if (sessionId) {
        await sessionRepo.remove(sessionId);
        cookie[sessionCookieKey].set({
          value: "",
          httpOnly: true,
          expires: new Date(0),
          maxAge: 0,
        });
      }
    })
    .derive(({ cookie, status }) => {
      const sessionId = cookie[sessionCookieKey]?.value as string | undefined;
      if (!sessionId) throw status(401);
      const session = sessionRepo.get(sessionId);
      if (!session) throw status(401);
      if (session.expiresAt < Date.now()) {
        sessionRepo.remove(sessionId);
        throw status(401);
      }
      const person = personRepo.get(session.personId);
      if (!person) throw status(401);

      async function logAction<
        TAction extends ActionType,
        TEntityType extends EntityType,
      >(
        type: TEntityType,
        action: TAction,
        entityId: string,
        changes: AuditLog["changes"]
      ) {
        const auditLog = {
          id: ulid(),
          timestamp: Date.now(),
          userId: person!.id,
          action,
          entityType: type,
          entityId,
          changes,
        };
        await auditLogRepo.set(auditLog);
        broadcastMutation(auditLog);
      }

      return {
        requester: person,
        logAction,
      };
    })
    .get("/api/me", ({ requester }) => {
      return requester;
    })
    .ws("/ws", {
      open(ws) {
        ws.subscribe("mutations");
      },
      close(ws) {
        ws.unsubscribe("mutations");
      },
      message(ws, message) {
        if ((message as any).topic === "ping") {
          ws.send(
            JSON.stringify({
              topic: "pong",
              timeStamp: new Date().toISOString(),
            })
          );
          return;
        }
      },
    })
    .get("/api/labels", async () => {
      const labels = labelRepo.list();
      labels.sort((a, b) => {
        return (
          (a.priority ?? Number.MAX_SAFE_INTEGER) -
          (b.priority ?? Number.MAX_SAFE_INTEGER)
        );
      });
      return labels;
    })
    .post(
      "/api/labels",
      async ({ body, logAction }) => {
        await labelRepo.set(body);
        logAction("LABEL", "CREATE", body.id, { after: body });
      },
      {
        body: labelSchema,
      }
    )
    .get("/api/labels/:id", ({ params, status }) => {
      const label = labelRepo.get(params.id);
      if (!label) return status(404);
      return label;
    })
    .patch(
      "/api/labels/:id",
      async ({ params, body, status, logAction }) => {
        const existing = labelRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await labelRepo.set(updated);
        logAction("LABEL", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
      },
      {
        body: t.Partial(labelSchema),
      }
    )
    .delete("/api/labels/:id", async ({ params, logAction }) => {
      const existing = labelRepo.get(params.id);
      if (!existing) return;
      await labelRepo.remove(params.id);
      const tasks = taskRepo.list();
      const removedLabelTasks = tasks.map((task) => {
        if (task.labelIds?.includes(params.id)) {
          return {
            ...task,
            labelIds: task.labelIds.filter((lid) => lid !== params.id),
          };
        }
        return task;
      });
      await taskRepo.replaceAll(removedLabelTasks);
      logAction("LABEL", "DELETE", params.id, { before: existing });
    })
    .get("/api/persons", () => {
      return personRepo.list();
    })
    .post(
      "/api/persons",
      async ({ body, logAction }) => {
        await personRepo.set(body);
        logAction("PERSON", "CREATE", body.id, { after: body });
      },
      {
        body: personSchema,
      }
    )
    .get("/api/persons/:id", ({ params, status }) => {
      const person = personRepo.get(params.id);
      if (!person) return status(404);
      return person;
    })
    .patch(
      "/api/persons/:id",
      async ({ params, body, status, logAction }) => {
        const existing = personRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await personRepo.set(updated);
        logAction("PERSON", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
      },
      {
        body: t.Partial(personSchema),
      }
    )
    .delete("/api/persons/:id", async ({ params, logAction }) => {
      const existing = personRepo.get(params.id);
      if (!existing) return;
      await personRepo.remove(params.id);
      const assignments = assignmentRepo.list();
      const otherPersonAssignments = assignments.filter(
        (a) => a.personId !== params.id
      );
      await assignmentRepo.replaceAll(otherPersonAssignments);
      logAction("PERSON", "DELETE", params.id, { before: existing });
    })
    .get("/api/projects", () => {
      return projectRepo.list();
    })
    .post(
      "/api/projects",
      async ({ body, logAction }) => {
        await projectRepo.set(body);
        logAction("PROJECT", "CREATE", body.id, { after: body });
      },
      {
        body: projectSchema,
      }
    )
    .get("/api/projects/:id", ({ params, status }) => {
      const project = projectRepo.get(params.id);
      if (!project) return status(404);
      return project;
    })
    .patch(
      "/api/projects/:id",
      async ({ params, body, status, logAction }) => {
        const existing = projectRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await projectRepo.set(updated);
        logAction("PROJECT", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
      },
      {
        body: t.Partial(projectSchema),
      }
    )
    .delete("/api/projects/:id", async ({ params, logAction }) => {
      const existing = projectRepo.get(params.id);
      if (!existing) return;
      await projectRepo.remove(params.id);
      const tasks = taskRepo.list();
      const otherProjectTasks = tasks.filter((t) => t.projectId !== params.id);
      await taskRepo.replaceAll(otherProjectTasks);
      const otherProjectTaskIdSet = new Set(otherProjectTasks.map((t) => t.id));
      const assignments = assignmentRepo.list();
      const otherProjectAssignments = assignments.filter((a) =>
        otherProjectTaskIdSet.has(a.taskId)
      );
      await assignmentRepo.replaceAll(otherProjectAssignments);
      const milestones = milestoneRepo.list();
      const otherProjectMilestones = milestones.filter(
        (m) => m.projectId !== params.id
      );
      await milestoneRepo.replaceAll(otherProjectMilestones);
      logAction("PROJECT", "DELETE", params.id, { before: existing });
    })
    .get("/api/milestones", () => {
      return milestoneRepo.list();
    })
    .post(
      "/api/milestones",
      async ({ body, logAction }) => {
        await milestoneRepo.set(body);
        logAction("MILESTONE", "CREATE", body.id, { after: body });
      },
      {
        body: milestoneSchema,
      }
    )
    .get("/api/milestones/:id", ({ params, status }) => {
      const milestone = milestoneRepo.get(params.id);
      if (!milestone) return status(404);
      return milestone;
    })
    .patch(
      "/api/milestones/:id",
      async ({ params, body, status, logAction }) => {
        const existing = milestoneRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await milestoneRepo.set(updated);
        if (body.dueDate !== undefined) {
          const tasks = taskRepo.list();
          const updatedTasks = tasks.map((task) => {
            if (task.milestoneId === params.id) {
              return {
                ...task,
                dueDate: body.dueDate ?? null,
              };
            }
            return task;
          });
          await taskRepo.replaceAll(updatedTasks);
        }
        logAction("MILESTONE", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
      },
      {
        body: t.Partial(milestoneSchema),
      }
    )
    .delete("/api/milestones/:id", async ({ params, logAction }) => {
      const existing = milestoneRepo.get(params.id);
      if (!existing) return;
      await milestoneRepo.remove(params.id);
      const tasks = taskRepo.list();
      const removeDeletedMilestoneTasks = tasks.map((task) => {
        if (task.milestoneId === params.id) {
          return {
            ...task,
            milestoneId: null,
          };
        }
        return task;
      });
      await taskRepo.replaceAll(removeDeletedMilestoneTasks);
      logAction("MILESTONE", "DELETE", params.id, { before: existing });
    })
    .get("/api/tasks", () => {
      return taskRepo.list();
    })
    .post(
      "/api/tasks",
      async ({ body, logAction }) => {
        await taskRepo.set(body);
        logAction("TASK", "CREATE", body.id, { after: body });
      },
      {
        body: taskSchema,
      }
    )
    .get("/api/tasks/:id", ({ params, status }) => {
      const task = taskRepo.get(params.id);
      if (!task) return status(404);
      return task;
    })
    .patch(
      "/api/tasks/:id",
      async ({ params, body, status, logAction }) => {
        const existing = taskRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await taskRepo.set(updated);
        logAction("TASK", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
      },
      {
        body: t.Partial(taskSchema),
      }
    )
    .delete("/api/tasks/:id", async ({ params, logAction }) => {
      const existing = taskRepo.get(params.id);
      if (!existing) return;
      await taskRepo.remove(params.id);
      const assignments = assignmentRepo.list();
      const otherTaskAssignments = assignments.filter(
        (a) => a.taskId !== params.id
      );
      await assignmentRepo.replaceAll(otherTaskAssignments);
      logAction("TASK", "DELETE", params.id, { before: existing });
    })
    .get("/api/plannings", () => {
      return planningRepo.list();
    })
    .post(
      "/api/plannings",
      async ({ body, logAction }) => {
        await planningRepo.set(body);
        logAction("PLANNING", "CREATE", body.id, { after: body });
      },
      {
        body: planningSchema,
      }
    )
    .get("/api/plannings/:id", ({ params, status }) => {
      const planning = planningRepo.get(params.id);
      if (!planning) return status(404);
      return planning;
    })
    .patch(
      "/api/plannings/:id",
      async ({ params, body, status, logAction }) => {
        const existing = planningRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await planningRepo.set(updated);
        logAction("PLANNING", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
      },
      {
        body: t.Partial(planningSchema),
      }
    )
    .delete("/api/plannings/:id", async ({ params, logAction }) => {
      const existing = planningRepo.get(params.id);
      if (!existing) return;
      await planningRepo.remove(params.id);
      logAction("PLANNING", "DELETE", params.id, { before: existing });
    })
    .get("/api/assignments", () => {
      return assignmentRepo.list();
    })
    .post(
      "/api/assignments",
      async ({ body, logAction }) => {
        await assignmentRepo.set(body);
        logAction("ASSIGNMENT", "CREATE", body.id, { after: body });
      },
      {
        body: assignmentSchema,
      }
    )
    .get("/api/assignments/:id", async ({ params, status }) => {
      const assignment = assignmentRepo.get(params.id);
      if (!assignment) return status(404);
      return assignment;
    })
    .patch(
      "/api/assignments/:id",
      async ({ params, body, status, logAction }) => {
        const existing = assignmentRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await assignmentRepo.set(updated);
        logAction("ASSIGNMENT", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
      },
      {
        body: t.Partial(assignmentSchema),
      }
    )
    .delete("/api/assignments/:id", async ({ params, logAction }) => {
      const existing = assignmentRepo.get(params.id);
      if (!existing) return;
      await assignmentRepo.remove(params.id);
      logAction("ASSIGNMENT", "DELETE", params.id, { before: existing });
    })
    .get("/api/audit-logs", () => {
      const logs = auditLogRepo.list();
      logs.sort((a, b) => b.timestamp - a.timestamp);
      return logs;
    });

  return api;
}

export type Api = Awaited<ReturnType<typeof buildApi>>;
