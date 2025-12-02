import Elysia, { t } from "elysia";
import { createYamlRepo } from "./utils/YamlRepo";
import { projectSchema } from "./schemas/Project";
import { taskSchema } from "./schemas/Task";
import { assignmentSchema } from "./schemas/Assignment";
import type { Logger } from "~shared/Logger";
import { personSchema } from "./schemas/Person";

export function buildApi(logger: Logger) {
  const projectRepo = createYamlRepo("projects.yaml", projectSchema, logger);
  const taskRepo = createYamlRepo("tasks.yaml", taskSchema, logger);
  const assignmentRepo = createYamlRepo(
    "assignments.yaml",
    assignmentSchema,
    logger
  );
  const personRepo = createYamlRepo("persons.yaml", personSchema, logger);

  return new Elysia()
    .get("/api/persons", async () => {
      return await personRepo.list();
    })
    .post(
      "/api/persons",
      async ({ body }) => {
        await personRepo.set(body);
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
      },
      {
        body: t.Partial(personSchema),
      }
    )
    .delete("/api/persons/:id", async ({ params }) => {
      await personRepo.remove(params.id);
    })
    .get("/api/projects", async () => {
      return await projectRepo.list();
    })
    .post(
      "/api/projects",
      async ({ body }) => {
        await projectRepo.set(body);
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
      },
      {
        body: t.Partial(projectSchema),
      }
    )
    .delete("/api/projects/:id", async ({ params }) => {
      await projectRepo.remove(params.id);
    })
    .get("/api/tasks", async () => {
      return await taskRepo.list();
    })
    .post(
      "/api/tasks",
      async ({ body }) => {
        await taskRepo.set(body);
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
      },
      {
        body: t.Partial(taskSchema),
      }
    )
    .delete("/api/tasks/:id", async ({ params }) => {
      await taskRepo.remove(params.id);
    })
    .get("/api/assignments", async () => {
      return await assignmentRepo.list();
    })
    .post(
      "/api/assignments",
      async ({ body }) => {
        await assignmentRepo.set(body);
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
      },
      {
        body: t.Partial(assignmentSchema),
      }
    )
    .delete("/api/assignments/:id", async ({ params }) => {
      await assignmentRepo.remove(params.id);
    });
}

export type Api = ReturnType<typeof buildApi>;
