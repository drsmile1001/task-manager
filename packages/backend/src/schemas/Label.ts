import { t } from "elysia";

export const labelSchema = t.Object({
  id: t.String(),
  name: t.String(),
  color: t.String(),
  priority: t.Nullable(t.Number()),
});

export type Label = typeof labelSchema.static;
