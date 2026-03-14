import { MigrationBuilder } from "@drsmile1001/entity-store";
import { t } from "elysia";

export const taskSchema = t.Object({
  id: t.String(),
  projectId: t.String(),
  milestoneId: t.Nullable(t.String()),
  name: t.String(),
  description: t.String(),
  isDone: t.Boolean(),
  completedAt: t.Nullable(t.Number()),
  isArchived: t.Boolean(),
  labelIds: t.Array(t.String()),
  dueDate: t.Nullable(t.String({ format: "date" })),
  assigneeIds: t.Array(t.String()),
});

export type Task = typeof taskSchema.static;

export const taskMigrations = MigrationBuilder.create<{
  id: string;
  projectId: string;
  name: string;
  description: string;
  isDone: boolean;
  completedAt?: number | null;
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
      completedAt: null as number | null,
      isArchived: item.isArchived ?? false,
      labelIds: item.labelIds ?? [],
      dueDate: null as string | null,
      assigneeIds: [],
    }))
  )
  .addMigration("加入里程碑欄位", (data) =>
    data.map((item) => ({
      ...item,
      milestoneId: null,
    }))
  )
  .addMigration("dueDate改用純日期字串", (data) =>
    data.map((item) => ({
      ...item,
      dueDate: item.dueDate ? item.dueDate.split("T")[0] : null,
    }))
  )
  .addMigration("加入完成時間欄位", (data) => {
    const migratedAt = Date.now();
    return data.map((item) => ({
      ...item,
      completedAt: item.completedAt ?? (item.isDone ? migratedAt : null),
    }));
  })
  .build();
