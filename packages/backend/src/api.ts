import Elysia, { t } from "elysia";
import { createYamlRepo } from "./utils/YamlRepo";
import { projectSchema } from "./schemas/Project";
import { taskSchema } from "./schemas/Task";
import { assignmentSchema } from "./schemas/Assignment";
import type { Logger } from "~shared/Logger";
import { personSchema } from "./schemas/Person";

let currentBunServer: Bun.Server<unknown> | null = null;

export type MutationMessage = {
  type: "person" | "project" | "task" | "assignment";
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

export function buildApi(logger: Logger) {
  const projectRepo = createYamlRepo(
    "data/projects.yaml",
    projectSchema,
    logger
  );
  const taskRepo = createYamlRepo("data/tasks.yaml", taskSchema, logger);
  const assignmentRepo = createYamlRepo(
    "data/assignments.yaml",
    assignmentSchema,
    logger
  );
  const personRepo = createYamlRepo("data/persons.yaml", personSchema, logger);

  function broadcastMutation(message: {
    type: "person" | "project" | "task" | "assignment";
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
    .get("/api/persons", async () => {
      return await personRepo.list();
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
    .get("/api/persons/:id", async ({ params, status }) => {
      const person = await personRepo.get(params.id);
      if (!person) return status(404);
      return person;
    })
    .patch(
      "/api/persons/:id",
      async ({ params, body, status }) => {
        const existing = await personRepo.get(params.id);
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
      broadcastMutation({
        type: "person",
        action: "delete",
        id: params.id,
      });
    })
    .get("/api/projects", async () => {
      return (await projectRepo.list()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
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
    .get("/api/projects/:id", async ({ params, status }) => {
      const project = await projectRepo.get(params.id);
      if (!project) return status(404);
      return project;
    })
    .patch(
      "/api/projects/:id",
      async ({ params, body, status }) => {
        const existing = await projectRepo.get(params.id);
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
      broadcastMutation({
        type: "project",
        action: "delete",
        id: params.id,
      });
    })
    .get("/api/tasks", async () => {
      return await taskRepo.list();
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
    .get("/api/tasks/:id", async ({ params, status }) => {
      const task = await taskRepo.get(params.id);
      if (!task) return status(404);
      return task;
    })
    .patch(
      "/api/tasks/:id",
      async ({ params, body, status }) => {
        const existing = await taskRepo.get(params.id);
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
      const assignments = await assignmentRepo.list();
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
    .get("/api/assignments", async () => {
      return await assignmentRepo.list();
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
      const assignment = await assignmentRepo.get(params.id);
      if (!assignment) return status(404);
      return assignment;
    })
    .patch(
      "/api/assignments/:id",
      async ({ params, body, status }) => {
        const existing = await assignmentRepo.get(params.id);
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

export type Api = ReturnType<typeof buildApi>;
