import { t } from "elysia";

export const planningSchema = t.Object({
  id: t.String(),
  taskId: t.String(),
  weekStartDate: t.String({ format: "date" }),
});

export type Planning = typeof planningSchema.static;
