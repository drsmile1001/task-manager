import { t, type Static } from "elysia";
import { type TObject, type TString } from "@sinclair/typebox";
import QuickLRU from "quick-lru";
import { Value } from "@sinclair/typebox/value";
import type { Logger } from "~shared/Logger";

export interface YamlRepo<T> {
  list(): Promise<T[]>;
  replaceAll(items: T[]): Promise<void>;
  get(id: string): Promise<T | undefined>;
  set(item: T): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createYamlRepo<
  T extends TObject<{
    id: TString;
  }>,
>(
  path: string,
  schema: T,
  baseLogger: Logger
): YamlRepo<Static<typeof schema>> {
  type ItemType = Static<typeof schema>;
  const cache = new QuickLRU<string, ItemType>({ maxSize: 1000 });
  const yamlSchema = t.Array(schema);
  const logger = baseLogger.extend("YamlRepo", {
    path,
  });

  async function list(): Promise<ItemType[]> {
    try {
      const yaml = await Bun.file(path).text();
      const data = Bun.YAML.parse(yaml);
      if (!Value.Check(yamlSchema, data)) {
        logger.error(
          {
            data,
          },
          `${path} 格式錯誤，回傳空清單`
        );
        return [];
      }
      return data;
    } catch (error) {
      logger.error(
        {
          error,
        },
        `無法讀取 ${path}，回傳空清單`
      );
      return [];
    }
  }

  async function get(id: string): Promise<ItemType | undefined> {
    const cached = cache.get(id);
    if (cached) {
      return cached;
    }
    const data = await list();
    const item = data.find((p) => p.id === id);
    if (item) {
      cache.set(id, item);
    }
    return item;
  }

  async function set(item: ItemType): Promise<void> {
    const items = await list();
    const index = items.findIndex((p) => p.id === item.id);
    if (index !== -1) {
      items[index] = item;
    } else {
      items.push(item);
    }
    const yaml = Bun.YAML.stringify(items, null, 2);
    await Bun.file(path).write(yaml);
    cache.set(item.id, item);
  }

  async function replaceAll(items: ItemType[]): Promise<void> {
    const yaml = Bun.YAML.stringify(items, null, 2);
    await Bun.file(path).write(yaml);
    cache.clear();
  }

  async function remove(id: string): Promise<void> {
    const items = await list();
    const filtered = items.filter((p) => p.id !== id);
    const yaml = Bun.YAML.stringify(filtered, null, 2);
    await Bun.file(path).write(yaml);
    cache.delete(id);
  }

  return {
    list,
    get,
    set,
    replaceAll,
    remove,
  };
}
