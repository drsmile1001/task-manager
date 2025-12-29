import { createYamlRepo, MigrationBuilder } from "@backend/utils/YamlRepo";
import { expect, test } from "bun:test";
import { t } from "elysia";
import { tmpdir } from "node:os";
import { ulid } from "ulid";
import { createDefaultLoggerFromEnv } from "~shared/Logger";

const sampleSchema = t.Object({
  id: t.String(),
  name: t.String(),
  age: t.Nullable(t.Number()),
  phone: t.Nullable(t.String()),
});

const logger = createDefaultLoggerFromEnv();
function createSmapleRepo(path: string) {
  return createYamlRepo(
    path,
    sampleSchema,
    logger,
    MigrationBuilder.create<{
      id: string;
      name: string;
    }>()
      .addMigration("新增 age 欄位，預設為 null", (data) =>
        data.map((item) => ({
          ...item,
          age: null,
        }))
      )
      .addMigration("新增 phone 欄位，預設為 null", (data) =>
        data.map((item) => ({
          ...item,
          phone: null,
        }))
      )
      .build()
  );
}

test("可從未有metadata遷移", async () => {
  const testFilePath = `${tmpdir()}/${ulid()}.yaml`;
  const oldData = [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
  ];
  const oldYaml = Bun.YAML.stringify(oldData, null, 2);
  await Bun.file(testFilePath).write(oldYaml);
  const repo = createSmapleRepo(testFilePath);
  await repo.init();

  const data = repo.list();
  expect(data).toEqual([
    { id: "1", name: "Alice", age: null, phone: null },
    { id: "2", name: "Bob", age: null, phone: null },
  ]);

  const newYaml = await Bun.file(testFilePath).text();
  const parsed = Bun.YAML.parse(newYaml);
  expect(parsed).toEqual({
    version: 2,
    data: [
      { id: "1", name: "Alice", age: null, phone: null },
      { id: "2", name: "Bob", age: null, phone: null },
    ],
  });
  console.log("Test file path:", testFilePath);
});

test("可從空白檔案讀取", async () => {
  const testFilePath = `${tmpdir()}/${ulid()}.yaml`;
  const repo = createSmapleRepo(testFilePath);
  await repo.init();

  const data = repo.list();
  expect(data).toEqual([]);

  const newYaml = await Bun.file(testFilePath).text();
  const parsed = Bun.YAML.parse(newYaml);
  expect(parsed).toEqual({
    version: 2,
    data: [],
  });
  console.log("Test file path:", testFilePath);
});

test("可以從中間版本遷移", async () => {
  const testFilePath = `${tmpdir()}/${ulid()}.yaml`;
  const oldData = {
    version: 1,
    data: [
      { id: "1", name: "Alice", age: 30 },
      { id: "2", name: "Bob", age: 25 },
    ],
  };
  const oldYaml = Bun.YAML.stringify(oldData, null, 2);
  await Bun.file(testFilePath).write(oldYaml);
  const repo = createSmapleRepo(testFilePath);
  await repo.init();

  const data = repo.list();
  expect(data).toEqual([
    { id: "1", name: "Alice", age: 30, phone: null },
    { id: "2", name: "Bob", age: 25, phone: null },
  ]);

  const newYaml = await Bun.file(testFilePath).text();
  const parsed = Bun.YAML.parse(newYaml);
  expect(parsed).toEqual({
    version: 2,
    data: [
      { id: "1", name: "Alice", age: 30, phone: null },
      { id: "2", name: "Bob", age: 25, phone: null },
    ],
  });
  console.log("Test file path:", testFilePath);
});
