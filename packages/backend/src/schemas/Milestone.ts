import { t } from "elysia";

export const milestoneSchema = t.Object({
  id: t.String(),
  projectId: t.String(),
  name: t.String(),
  description: t.String(),
  dueDate: t.Nullable(t.Date()),
});

export type Milestone = typeof milestoneSchema.static;
