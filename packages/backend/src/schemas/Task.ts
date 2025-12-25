import { t } from "elysia";

export const taskSchema = t.Object({
  id: t.String(),
  projectId: t.String(),
  name: t.String(),
  description: t.String(),
  isDone: t.Boolean(),
  labelIds: t.Optional(t.Array(t.String())),
});

export type Task = typeof taskSchema.static;
