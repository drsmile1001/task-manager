import { t } from "elysia";

export const projectSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  order: t.Optional(t.Nullable(t.Number())),
  isArchived: t.Optional(t.Boolean()),
});

export type Project = typeof projectSchema.static;
