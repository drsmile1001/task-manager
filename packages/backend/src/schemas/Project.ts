import { MigrationBuilder } from "@backend/utils/YamlRepo";
import { t } from "elysia";

export const projectSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  order: t.Nullable(t.Number()),
  isArchived: t.Boolean(),
  startedAt: t.Nullable(t.Date()),
  endedAt: t.Nullable(t.Date()),
});

export type Project = typeof projectSchema.static;

export const projectMigrations = MigrationBuilder.create<{
  id: string;
  name: string;
  description: string;
  order?: number | null;
  isArchived?: boolean;
}>()
  .addMigration("加入時間區間", (data) =>
    data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      order: item.order ?? null,
      isArchived: item.isArchived ?? false,
      startedAt: null,
      endedAt: null,
    }))
  )
  .build();
