import { t } from "elysia";

export const personSchema = t.Object({
  id: t.String(),
  name: t.String(),
});

export type Person = typeof personSchema.static;
