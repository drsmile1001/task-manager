import { MigrationBuilder } from "@backend/utils/YamlRepo";
import { t } from "elysia";

export const taskSchema = t.Object({
  id: t.String(),
  projectId: t.String(),
  milestoneId: t.Nullable(t.String()),
  name: t.String(),
  description: t.String(),
  isDone: t.Boolean(),
  isArchived: t.Boolean(),
  labelIds: t.Array(t.String()),
  dueDate: t.Nullable(t.Date()),
  assigneeIds: t.Array(t.String()),
});

export type Task = typeof taskSchema.static;

export const taskMigrations = MigrationBuilder.create<{
  id: string;
  projectId: string;
  name: string;
  description: string;
  isDone: boolean;
  isArchived?: boolean;
  labelIds?: string[];
}>()
  .addMigration("加入到期日與指派人員", (data) =>
    data.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      name: item.name,
      description: item.description,
      isDone: item.isDone,
      isArchived: item.isArchived ?? false,
      labelIds: item.labelIds ?? [],
      dueDate: null,
      assigneeIds: [],
    }))
  )
  .addMigration("加入里程碑欄位", (data) =>
    data.map((item) => ({
      ...item,
      milestoneId: null,
    }))
  )
  .build();
