import { t, type Static } from "elysia";
import { type TObject, type TString } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import type { Logger } from "~shared/Logger";

export interface YamlRepo<T> {
  init(): Promise<void>;
  list(): T[];
  replaceAll(items: T[]): Promise<void>;
  get(id: string): T | undefined;
  set(item: T): Promise<void>;
  remove(id: string): Promise<void>;
}

export type Migration = {
  drscription: string;
  migrate: (data: unknown[]) => unknown[];
};

const yamlDataWithMetaSchema = t.Object({
  version: t.Number(),
  data: t.Array(
    t.Object(
      {
        id: t.String(),
      },
      { additionalProperties: true }
    )
  ),
});

export function createYamlRepo<
  T extends TObject<{
    id: TString;
  }>,
>(
  path: string,
  schema: T,
  baseLogger: Logger,
  migrations: Migration[] = []
): YamlRepo<Static<typeof schema>> {
  type ItemType = Static<typeof schema>;
  const cache = new Map<string, ItemType>();
  const yamlSchema = t.Array(schema);
  const logger = baseLogger.extend("YamlRepo", { path });

  async function init(): Promise<void> {
    let migrated = false;
    try {
      let fileExists = true;
      let yaml = "";
      try {
        yaml = await Bun.file(path).text();
      } catch (e) {
        fileExists = false;
      }

      let version = 0;
      let data: unknown[] = [];
      if (!fileExists) {
        version = migrations.length;
        data = [];
        migrated = true;
      } else {
        const parsed = Bun.YAML.parse(yaml);
        if (Array.isArray(parsed)) {
          data = parsed;
          version = 0;
        } else if (Value.Check(yamlDataWithMetaSchema, parsed)) {
          version = parsed.version;
          data = parsed.data;
        } else {
          logger.error(`${path} 格式錯誤，回傳空清單`);
          cache.clear();
          return;
        }
      }

      let currentMigration = 0;
      for (const migration of migrations) {
        currentMigration += 1;
        if (currentMigration > version) {
          data = migration.migrate(data);
          version = currentMigration;
          migrated = true;
          logger.info(`執行 migration: ${migration.drscription}`);
        }
      }

      if (data.length && !Value.Check(yamlSchema, data)) {
        logger.error(`${path} 格式錯誤，回傳空清單`);
        cache.clear();
        return;
      }

      if (migrated) {
        const out = { version, data };
        const outYaml = Bun.YAML.stringify(out, null, 2);
        await Bun.file(path).write(outYaml);
      }

      cache.clear();
      for (const item of data as ItemType[]) {
        cache.set(item.id, item);
      }
    } catch (error) {
      logger.error({ error }, `無法讀取 ${path}，回傳空清單`);
      cache.clear();
    }
  }

  function list(): ItemType[] {
    return Array.from(cache.values());
  }

  function get(id: string): ItemType | undefined {
    return cache.get(id);
  }

  async function set(item: ItemType): Promise<void> {
    cache.set(item.id, item);
    await persist();
  }

  async function replaceAll(items: ItemType[]): Promise<void> {
    cache.clear();
    for (const item of items) {
      cache.set(item.id, item);
    }
    await persist();
  }

  async function remove(id: string): Promise<void> {
    cache.delete(id);
    await persist();
  }

  async function persist(): Promise<void> {
    const items = Array.from(cache.values());
    const version = migrations.length;
    const out = { version, data: items };
    const yaml = Bun.YAML.stringify(out, null, 2);
    await Bun.file(path).write(yaml);
  }

  return {
    init,
    list,
    get,
    set,
    replaceAll,
    remove,
  };
}

export class MigrationBuilder<T> {
  private migrations: Migration[] = [];

  private constructor() {}

  static create<T>(): MigrationBuilder<T> {
    return new MigrationBuilder<T>();
  }

  addMigration<TNext>(
    description: string,
    migrateFn: (data: T[]) => TNext[]
  ): MigrationBuilder<TNext> {
    this.migrations.push({
      drscription: description,
      migrate: (data: unknown[]) => migrateFn(data as T[]),
    });
    return this as unknown as MigrationBuilder<TNext>;
  }
  build(): Migration[] {
    return this.migrations;
  }
}
