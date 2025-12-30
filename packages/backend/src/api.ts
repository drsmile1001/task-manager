import Elysia, { t } from "elysia";
import { createYamlRepo } from "./utils/YamlRepo";
import { projectMigrations, projectSchema } from "./schemas/Project";
import { taskMigrations, taskSchema } from "./schemas/Task";
import { assignmentSchema } from "./schemas/Assignment";
import type { Logger } from "~shared/Logger";
import { personSchema } from "./schemas/Person";
import { labelSchema } from "./schemas/Label";
import { milestoneSchema } from "./schemas/Milestone";

let currentBunServer: Bun.Server<unknown> | null = null;

export type MutationMessage = {
  type: "person" | "project" | "task" | "assignment" | "label" | "milestone";
  action: "create" | "update" | "delete";
  id: string;
  eneity?: unknown;
};

export type MutationTopic = {
  topic: "mutations";
} & MutationMessage;

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
    logger
  );
  await milestoneRepo.init();

  const taskRepo = createYamlRepo(
    "data/tasks.yaml",
    taskSchema,
    logger,
    taskMigrations,
    (t) => ({
      ...t,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
    }),
    (t) =>
      ({
        ...t,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      }) as any
  );
  await taskRepo.init();
  const assignmentRepo = createYamlRepo(
    "data/assignments.yaml",
    assignmentSchema,
    logger
  );
  await assignmentRepo.init();
  const personRepo = createYamlRepo("data/persons.yaml", personSchema, logger);
  await personRepo.init();
  const labelRepo = createYamlRepo("data/labels.yaml", labelSchema, logger);
  await labelRepo.init();

  function broadcastMutation(message: {
    type: "person" | "project" | "milestone" | "task" | "assignment" | "label";
    action: "create" | "update" | "delete";
    id: string;
    eneity?: unknown;
  }) {
    logger.info(
      {
        type: "broadcastMutation",
        message,
      },
      `Broadcasting mutation: ${message.type} ${message.action} ${message.id}`
    );
    currentBunServer?.publish(
      "mutations",
      JSON.stringify({
        topic: "mutations",
        ...message,
      })
    );
  }

  const api = new Elysia()
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
      const labels = await labelRepo.list();
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
      async ({ body }) => {
        await labelRepo.set(body);
        broadcastMutation({
          type: "label",
          action: "create",
          id: body.id,
          eneity: body,
        });
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
      async ({ params, body, status }) => {
        const existing = labelRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await labelRepo.set(updated);
        broadcastMutation({
          type: "label",
          action: "update",
          id: params.id,
          eneity: updated,
        });
      },
      {
        body: t.Partial(labelSchema),
      }
    )
    .delete("/api/labels/:id", async ({ params }) => {
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

      broadcastMutation({
        type: "label",
        action: "delete",
        id: params.id,
      });
    })
    .get("/api/persons", () => {
      return personRepo.list();
    })
    .post(
      "/api/persons",
      async ({ body }) => {
        await personRepo.set(body);
        broadcastMutation({
          type: "person",
          action: "create",
          id: body.id,
          eneity: body,
        });
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
      async ({ params, body, status }) => {
        const existing = personRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await personRepo.set(updated);
        broadcastMutation({
          type: "person",
          action: "update",
          id: params.id,
          eneity: updated,
        });
      },
      {
        body: t.Partial(personSchema),
      }
    )
    .delete("/api/persons/:id", async ({ params }) => {
      await personRepo.remove(params.id);
      const assignments = assignmentRepo.list();
      const otherPersonAssignments = assignments.filter(
        (a) => a.personId !== params.id
      );
      await assignmentRepo.replaceAll(otherPersonAssignments);
      broadcastMutation({
        type: "person",
        action: "delete",
        id: params.id,
      });
    })
    .get("/api/projects", () => {
      return projectRepo.list();
    })
    .post(
      "/api/projects",
      async ({ body }) => {
        await projectRepo.set(body);
        broadcastMutation({
          type: "project",
          action: "create",
          id: body.id,
          eneity: body,
        });
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
      async ({ params, body, status }) => {
        const existing = projectRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await projectRepo.set(updated);
        broadcastMutation({
          type: "project",
          action: "update",
          id: params.id,
          eneity: updated,
        });
      },
      {
        body: t.Partial(projectSchema),
      }
    )
    .delete("/api/projects/:id", async ({ params }) => {
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
      broadcastMutation({
        type: "project",
        action: "delete",
        id: params.id,
      });
    })
    .get("/api/milestones", () => {
      return milestoneRepo.list();
    })
    .post(
      "/api/milestones",
      async ({ body }) => {
        await milestoneRepo.set(body);
        broadcastMutation({
          type: "milestone",
          action: "create",
          id: body.id,
          eneity: body,
        });
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
      async ({ params, body, status }) => {
        const existing = milestoneRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await milestoneRepo.set(updated);
        broadcastMutation({
          type: "milestone",
          action: "update",
          id: params.id,
          eneity: updated,
        });
      },
      {
        body: t.Partial(milestoneSchema),
      }
    )
    .delete("/api/milestones/:id", async ({ params }) => {
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
      broadcastMutation({
        type: "milestone",
        action: "delete",
        id: params.id,
      });
    })
    .get("/api/tasks", () => {
      return taskRepo.list();
    })
    .post(
      "/api/tasks",
      async ({ body }) => {
        await taskRepo.set(body);
        broadcastMutation({
          type: "task",
          action: "create",
          id: body.id,
          eneity: body,
        });
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
      async ({ params, body, status }) => {
        const existing = taskRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await taskRepo.set(updated);
        broadcastMutation({
          type: "task",
          action: "update",
          id: params.id,
          eneity: updated,
        });
      },
      {
        body: t.Partial(taskSchema),
      }
    )
    .delete("/api/tasks/:id", async ({ params }) => {
      await taskRepo.remove(params.id);
      const assignments = assignmentRepo.list();
      const otherTaskAssignments = assignments.filter(
        (a) => a.taskId !== params.id
      );
      await assignmentRepo.replaceAll(otherTaskAssignments);
      broadcastMutation({
        type: "task",
        action: "delete",
        id: params.id,
      });
    })
    .get("/api/assignments", () => {
      return assignmentRepo.list();
    })
    .post(
      "/api/assignments",
      async ({ body }) => {
        await assignmentRepo.set(body);
        broadcastMutation({
          type: "assignment",
          action: "create",
          id: body.id,
          eneity: body,
        });
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
      async ({ params, body, status }) => {
        const existing = assignmentRepo.get(params.id);
        if (!existing) return status(404);
        const updated = { ...existing, ...body };
        await assignmentRepo.set(updated);
        broadcastMutation({
          type: "assignment",
          action: "update",
          id: params.id,
          eneity: updated,
        });
      },
      {
        body: t.Partial(assignmentSchema),
      }
    )
    .delete("/api/assignments/:id", async ({ params }) => {
      await assignmentRepo.remove(params.id);
      broadcastMutation({
        type: "assignment",
        action: "delete",
        id: params.id,
      });
    });

  return api;
}

export type Api = Awaited<ReturnType<typeof buildApi>>;
