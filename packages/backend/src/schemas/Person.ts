import { MigrationBuilder } from "@backend/utils/YamlRepo";
import { t } from "elysia";

export const personSchema = t.Object({
  id: t.String(),
  name: t.String(),
  order: t.Optional(t.Nullable(t.Number())),
  email: t.String(),
});

export type Person = typeof personSchema.static;

export const personMigrations = MigrationBuilder.create<{
  id: string;
  name: string;
  order?: number | null;
}>()
  .addMigration("加入email", (data) =>
    data.map((item) => ({
      ...item,
      email: "",
    }))
  )
  .build();
