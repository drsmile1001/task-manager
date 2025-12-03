import { Elysia, file } from "elysia";
import { createDefaultLoggerFromEnv } from "~shared/Logger";
import {
  buildApi,
  setCurrentBunServerPublish as setCurrentBunServer,
} from "./api";
import { exists, readdir, readFile, writeFile } from "node:fs/promises";

const logger = createDefaultLoggerFromEnv();

const baseUrl = process.env.BASE_URL || "/";
const baseUrlPlaceholder = "/__BASE_URL_TO_REPLACE__/";

async function rewriteBaseUrl(root: string) {
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
      const replaced = content.replaceAll(baseUrlPlaceholder, baseUrl);
      await writeFile(fullPath, replaced, "utf-8");
    }
  }
}

await rewriteBaseUrl("public");

new Elysia()
  .use(buildApi(logger))
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
    if (await exists(filePath)) {
      return file(filePath);
    }
    return file("public/index.html");
  })
  .get("/*", () => file("public/index.html"))
  .listen(3000, (server) => {
    setCurrentBunServer(server);
    console.log("Server is running on http://localhost:3000");
  });
