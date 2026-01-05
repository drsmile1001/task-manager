import { t } from "elysia";

export const sessionSchema = t.Object({
  id: t.String(),
  personId: t.String(),
  createdAt: t.Number(),
  expiresAt: t.Number(),
});

export type Session = typeof sessionSchema.static;
