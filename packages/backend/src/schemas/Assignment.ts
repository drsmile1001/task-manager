import { t } from "elysia";

export const assignmentSchema = t.Object({
  id: t.String(),
  taskId: t.String(),
  personId: t.String(),
  date: t.String(),
  note: t.Optional(t.String()),
});

export type Assignment = typeof assignmentSchema.static;
