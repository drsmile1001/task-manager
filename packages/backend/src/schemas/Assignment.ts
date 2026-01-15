import { MigrationBuilder } from "@backend/utils/YamlRepo";
import { t } from "elysia";

export const assignmentSchema = t.Object({
  id: t.String(),
  taskId: t.String(),
  personId: t.String(),
  date: t.String({ format: "date" }),
  acknowledged: t.Boolean(),
});

export type Assignment = typeof assignmentSchema.static;

export const assignmentMigrations = MigrationBuilder.create<{
  id: string;
  taskId: string;
  personId: string;
  date: string;
  note?: string;
}>()
  .addMigration("加入acknowledged", (data) =>
    data.map(({ note, ...rest }) => ({
      ...rest,
      acknowledged: false,
    }))
  )
  .build();
