import { t } from "elysia";

export const personSchema = t.Object({
  id: t.String(),
  name: t.String(),
  order: t.Optional(t.Nullable(t.Number())),
});

export type Person = typeof personSchema.static;
