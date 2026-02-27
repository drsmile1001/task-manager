import { buildApi } from "@backend/api";
import { AutoArchiveScheduler } from "@backend/services/AutoArchiveScheduler";
import { MutationPublisherService } from "@backend/services/MutationPublisher";
import {
  createRepositories,
  initRepositories,
} from "@backend/services/Repositories";
import { TaskAutoArchiveService } from "@backend/services/TaskAutoArchiveService";
import { createDefaultLoggerFromEnv } from "@backend/utils/Logger";
import { Elysia, file } from "elysia";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";

const logger = createDefaultLoggerFromEnv();

const baseUrl = process.env.BASE_URL || "/";
const baseUrlPlaceholder = "/__BASE_URL_TO_REPLACE__/";
const googleClientId = Bun.env.GOOGLE_CLIENT_ID;
const googleClientIdPlaceholder = "__GOOGLE_CLIENT_ID__";

async function rewriteBaseUrl(root: string) {
  const rootExists = await stat(root)
    .then((s) => s.isDirectory())
    .catch(() => false);
  if (!rootExists && Bun.env.NODE_ENV !== "production") {
    return;
  }
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = `${root}/${entry.name}`;
    if (entry.isDirectory()) {
      await rewriteBaseUrl(fullPath);
      continue;
    }

    if (
      entry.name.endsWith(".js") ||
      entry.name.endsWith(".css") ||
      entry.name.endsWith(".html")
    ) {
      const content = await readFile(fullPath, "utf-8");
      const replaced = content
        .replaceAll(baseUrlPlaceholder, baseUrl)
        .replaceAll(googleClientIdPlaceholder, googleClientId || "");

      await writeFile(fullPath, replaced, "utf-8");
    }
  }
}

await rewriteBaseUrl("public");

const repos = createRepositories(logger);
await initRepositories(repos);
const mutationPublisher = new MutationPublisherService(logger);
const autoArchiveEnabled = Bun.env.AUTO_ARCHIVE_ENABLED !== "0";
const autoArchiveDays = Number(Bun.env.AUTO_ARCHIVE_DAYS ?? "7");
const autoArchiveTimezone = Bun.env.AUTO_ARCHIVE_TZ ?? "Asia/Taipei";
const taskAutoArchiveService = new TaskAutoArchiveService({
  logger,
  repos,
  mutationPublisher,
});
const autoArchiveScheduler = new AutoArchiveScheduler({
  logger,
  taskAutoArchiveService,
  enabled: autoArchiveEnabled,
  days: autoArchiveDays,
  timezone: autoArchiveTimezone,
  actorId: "system-auto-archive",
});

const app = new Elysia()
  .use(await buildApi({ logger, repos, mutationPublisher }))
  .get("/*", async ({ path }) => {
    const allowedExtensions = [
      ".js",
      ".css",
      ".html",
      ".png",
      ".jpg",
      ".svg",
      ".ico",
      ".json",
    ];
    const hasAllowedExtension = allowedExtensions.some((ext) =>
      path.endsWith(ext)
    );
    if (!hasAllowedExtension) {
      return file("public/index.html");
    }
    const filePath = `public${path}`;
    const fileExists = await stat(filePath)
      .then((s) => s.isFile())
      .catch(() => false);
    if (fileExists) {
      return file(filePath);
    }
    return file("public/index.html");
  })
  .get("/*", () => file("public/index.html"))
  .listen(3000, (server) => {
    mutationPublisher.setServer(server);
    autoArchiveScheduler.start();
    if (autoArchiveEnabled) {
      void autoArchiveScheduler.runOnce();
    }
    logger.info(`伺服器已啟動，監聽於 http://localhost:3000${baseUrl}`);
  });

let isShuttingDown = false;
async function shutdown(signal: string) {
  if (isShuttingDown) {
    logger.warn(`已經在關閉中，忽略重複的 ${signal} 信號。`);
    return;
  }
  isShuttingDown = true;
  logger.info(`收到 ${signal} 信號，正在關閉伺服器...`);
  autoArchiveScheduler.stop();
  await app.stop(true);
  logger.info("伺服器已成功關閉。");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
