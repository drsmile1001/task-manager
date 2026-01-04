import { MigrationBuilder } from "@backend/utils/YamlRepo";
import { t } from "elysia";

export const milestoneSchema = t.Object({
  id: t.String(),
  projectId: t.String(),
  name: t.String(),
  description: t.String(),
  dueDate: t.Nullable(t.String({ format: "date" })),
  isArchived: t.Boolean(),
});

export type Milestone = typeof milestoneSchema.static;

export const milestoneMigrations = MigrationBuilder.create<{
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate?: string | null;
}>()
  .addMigration("dueDate改用純日期字串", (data) =>
    data.map((item) => ({
      ...item,
      dueDate: item.dueDate ? item.dueDate.split("T")[0] : null,
    }))
  )
  .addMigration("加入isArchived欄位", (data) =>
    data.map((item) => ({
      ...item,
      isArchived: false,
    }))
  )
  .build();
