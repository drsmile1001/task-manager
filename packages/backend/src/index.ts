import { Elysia } from "elysia";
import { createDefaultLoggerFromEnv } from "~shared/Logger";
import { buildApi } from "./api";

const logger = createDefaultLoggerFromEnv();

new Elysia().use(buildApi(logger)).listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
