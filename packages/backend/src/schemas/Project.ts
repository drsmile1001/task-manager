import { t } from "elysia";

export const projectSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
});

export type Project = typeof projectSchema.static;
