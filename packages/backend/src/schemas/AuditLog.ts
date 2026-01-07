import { t } from "elysia";

export const actionType = t.UnionEnum(["CREATE", "UPDATE", "DELETE"]);

export type ActionType = typeof actionType.static;

export const entityTypes = t.UnionEnum([
  "PERSON",
  "LABEL",
  "PROJECT",
  "MILESTONE",
  "TASK",
  "PLANNING",
  "ASSIGNMENT",
]);

export type EntityType = typeof entityTypes.static;

export const auditLogSchema = t.Object({
  id: t.String(),
  timestamp: t.Number(),
  userId: t.String(),
  action: actionType,
  entityType: entityTypes,
  entityId: t.String(),
  changes: t.Object({
    before: t.Optional(t.Unknown()),
    after: t.Optional(t.Unknown()),
  }),
});

export type AuditLog = typeof auditLogSchema.static;
