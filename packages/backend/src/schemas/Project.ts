import { t } from "elysia";

export const projectSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  order: t.Optional(t.Nullable(t.Number())),
});

export type Project = typeof projectSchema.static;
