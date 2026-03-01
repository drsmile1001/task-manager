import { SYSTEM_USERS } from "@backend/constants/SystemUsers";
import { assignmentSchema } from "@backend/schemas/Assignment";
import {
  type ActionType,
  type AuditLog,
  type EntityType,
} from "@backend/schemas/AuditLog";
import { labelSchema } from "@backend/schemas/Label";
import { milestoneSchema } from "@backend/schemas/Milestone";
import { personSchema } from "@backend/schemas/Person";
import { planningSchema } from "@backend/schemas/Planning";
import { projectSchema } from "@backend/schemas/Project";
import { type Task, taskSchema } from "@backend/schemas/Task";
import type { MutationPublisherService } from "@backend/services/MutationPublisher";
import type { AppRepositories } from "@backend/services/Repositories";
import type { RequesterResolver } from "@backend/services/RequesterResolver";
import { applyTaskCreateAssigneePolicy } from "@backend/services/TaskAssigneePolicy";
import type { Logger } from "@drsmile1001/logger";
import { addDays } from "date-fns";
import { Elysia, t } from "elysia";
import { jwtDecode } from "jwt-decode";
import { ulid } from "ulid";

export async function buildApi(deps: {
  logger: Logger;
  repos: AppRepositories;
  mutationPublisher: MutationPublisherService;
  requesterResolver: RequesterResolver;
}) {
  const { repos, mutationPublisher, requesterResolver } = deps;
  const {
    projectRepo,
    milestoneRepo,
    taskRepo,
    planningRepo,
    assignmentRepo,
    personRepo,
    labelRepo,
    sessionRepo,
    auditLogRepo,
  } = repos;
  const taskWriteSchema = t.Omit(taskSchema, ["completedAt"]);

  const sessionCookieKey = "task-manager-session-id";

  const api = new Elysia()
    .post(
      "/api/login",
      async ({ body, cookie, status }) => {
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
        const userInfo = jwtDecode<{
          email: string;
          name: string;
          hd: string | undefined;
        }>(idToken);
        if (Bun.env.GOOGLE_OAUTH_HD_RESTRICTION) {
          if (userInfo.hd !== Bun.env.GOOGLE_OAUTH_HD_RESTRICTION) {
            return status(401);
          }
        }

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
          mutationPublisher.publish(auditLog);
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
    .derive(async ({ cookie, status, headers }) => {
      const apiKey = headers["x-api-key"];
      const sessionId = cookie[sessionCookieKey]?.value as string | undefined;
      const requester = await requesterResolver.resolve({ apiKey, sessionId });
      if (!requester) {
        throw status(401);
      }

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
          userId: requester!.id,
          action,
          entityType: type,
          entityId,
          changes,
        };
        await auditLogRepo.set(auditLog);
        mutationPublisher.publish(auditLog);
      }

      return {
        requester,
        logAction,
      };
    })
    .get("/api/me", ({ requester }) => {
      return requester;
    })
    .get("/api/system-users", () => {
      return SYSTEM_USERS;
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
        await logAction("LABEL", "CREATE", body.id, { after: body });
        return body;
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
        await logAction("LABEL", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
        return updated;
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
      await logAction("LABEL", "DELETE", params.id, { before: existing });
    })
    .get("/api/persons", () => {
      return personRepo.list();
    })
    .post(
      "/api/persons",
      async ({ body, logAction }) => {
        await personRepo.set(body);
        await logAction("PERSON", "CREATE", body.id, { after: body });
        return body;
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
        await logAction("PERSON", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
        return updated;
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
      await logAction("PERSON", "DELETE", params.id, { before: existing });
    })
    .get("/api/projects", () => {
      return projectRepo.list();
    })
    .post(
      "/api/projects",
      async ({ body, logAction }) => {
        await projectRepo.set(body);
        await logAction("PROJECT", "CREATE", body.id, { after: body });
        return body;
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
        await logAction("PROJECT", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
        return updated;
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
      const plannings = planningRepo.list();
      const otherProjectPlannings = plannings.filter((planning) =>
        otherProjectTaskIdSet.has(planning.taskId)
      );
      await planningRepo.replaceAll(otherProjectPlannings);
      const milestones = milestoneRepo.list();
      const otherProjectMilestones = milestones.filter(
        (m) => m.projectId !== params.id
      );
      await milestoneRepo.replaceAll(otherProjectMilestones);
      await logAction("PROJECT", "DELETE", params.id, { before: existing });
    })
    .get("/api/milestones", () => {
      return milestoneRepo.list();
    })
    .post(
      "/api/milestones",
      async ({ body, logAction }) => {
        await milestoneRepo.set(body);
        await logAction("MILESTONE", "CREATE", body.id, { after: body });
        return body;
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
          const nextDueDate = body.dueDate ?? null;
          const tasks = taskRepo.list();
          const taskUpdates: Array<{ before: Task; after: Task }> = [];
          const updatedTasks = tasks.map((task) => {
            if (task.milestoneId !== params.id) {
              return task;
            }
            if (task.dueDate === nextDueDate) {
              return task;
            }
            const updatedTask = {
              ...task,
              dueDate: nextDueDate,
            };
            taskUpdates.push({ before: task, after: updatedTask });
            return updatedTask;
          });
          if (taskUpdates.length > 0) {
            await taskRepo.replaceAll(updatedTasks);
            for (const taskUpdate of taskUpdates) {
              await logAction("TASK", "UPDATE", taskUpdate.before.id, {
                before: taskUpdate.before,
                after: taskUpdate.after,
              });
            }
          }
        }
        await logAction("MILESTONE", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
        return updated;
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
      const taskUpdates: Array<{ before: Task; after: Task }> = [];
      const removeDeletedMilestoneTasks = tasks.map((task) => {
        if (task.milestoneId !== params.id) {
          return task;
        }
        const updatedTask = {
          ...task,
          milestoneId: null,
        };
        taskUpdates.push({ before: task, after: updatedTask });
        return updatedTask;
      });
      if (taskUpdates.length > 0) {
        await taskRepo.replaceAll(removeDeletedMilestoneTasks);
        for (const taskUpdate of taskUpdates) {
          await logAction("TASK", "UPDATE", taskUpdate.before.id, {
            before: taskUpdate.before,
            after: taskUpdate.after,
          });
        }
      }
      await logAction("MILESTONE", "DELETE", params.id, { before: existing });
    })
    .get("/api/tasks", () => {
      return taskRepo.list();
    })
    .post(
      "/api/tasks",
      async ({ body, requester, logAction }) => {
        const task = {
          ...body,
          assigneeIds: applyTaskCreateAssigneePolicy({
            assigneeIds: body.assigneeIds,
            requesterId: requester.id,
          }),
          completedAt: body.isDone ? Date.now() : null,
        };
        await taskRepo.set(task);
        await logAction("TASK", "CREATE", body.id, { after: task });
        return task;
      },
      {
        body: taskWriteSchema,
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
        if (!existing.isDone && updated.isDone) {
          updated.completedAt = Date.now();
        } else if (existing.isDone && !updated.isDone) {
          updated.completedAt = null;
        }
        await taskRepo.set(updated);
        await logAction("TASK", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
        return updated;
      },
      {
        body: t.Partial(taskWriteSchema),
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
      const plannings = planningRepo.list();
      const otherTaskPlannings = plannings.filter(
        (p) => p.taskId !== params.id
      );
      await planningRepo.replaceAll(otherTaskPlannings);
      await logAction("TASK", "DELETE", params.id, { before: existing });
    })
    .get("/api/plannings", () => {
      return planningRepo.list();
    })
    .post(
      "/api/plannings",
      async ({ body, logAction }) => {
        await planningRepo.set(body);
        await logAction("PLANNING", "CREATE", body.id, { after: body });
        return body;
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
        await logAction("PLANNING", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
        return updated;
      },
      {
        body: t.Partial(planningSchema),
      }
    )
    .delete("/api/plannings/:id", async ({ params, logAction }) => {
      const existing = planningRepo.get(params.id);
      if (!existing) return;
      await planningRepo.remove(params.id);
      await logAction("PLANNING", "DELETE", params.id, { before: existing });
    })
    .get("/api/assignments", () => {
      return assignmentRepo.list();
    })
    .post(
      "/api/assignments",
      async ({ body, logAction }) => {
        await assignmentRepo.set(body);
        const existingTask = taskRepo.get(body.taskId);
        if (existingTask && !existingTask.assigneeIds.includes(body.personId)) {
          const updatedTask = {
            ...existingTask,
            assigneeIds: [...existingTask.assigneeIds, body.personId],
          };
          await taskRepo.set(updatedTask);
          await logAction("TASK", "UPDATE", existingTask.id, {
            before: existingTask,
            after: updatedTask,
          });
        }
        await logAction("ASSIGNMENT", "CREATE", body.id, { after: body });
        return body;
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
        const existingTask = taskRepo.get(updated.taskId);
        if (
          existingTask &&
          !existingTask.assigneeIds.includes(updated.personId)
        ) {
          const updatedTask = {
            ...existingTask,
            assigneeIds: [...existingTask.assigneeIds, updated.personId],
          };
          await taskRepo.set(updatedTask);
          await logAction("TASK", "UPDATE", existingTask.id, {
            before: existingTask,
            after: updatedTask,
          });
        }
        await logAction("ASSIGNMENT", "UPDATE", params.id, {
          before: existing,
          after: updated,
        });
        return updated;
      },
      {
        body: t.Partial(assignmentSchema),
      }
    )
    .delete("/api/assignments/:id", async ({ params, logAction }) => {
      const existing = assignmentRepo.get(params.id);
      if (!existing) return;
      await assignmentRepo.remove(params.id);
      await logAction("ASSIGNMENT", "DELETE", params.id, { before: existing });
    })
    .get("/api/audit-logs", () => {
      const logs = auditLogRepo.list();
      logs.sort((a, b) => b.timestamp - a.timestamp);
      return logs;
    });

  return api;
}

export type Api = Awaited<ReturnType<typeof buildApi>>;
