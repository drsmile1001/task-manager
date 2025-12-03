import { $ } from "bun";

await $`bun --filter '*' build`;
await $`rm -rf dist`;
await $`mkdir dist`;
await $`cp -R ./packages/backend/dist/* ./dist`;
await $`mkdir dist/public`;
await $`cp -R ./packages/frontend/dist/* ./dist/public`;
await $`echo NODE_ENV=production > dist/.env`;
console.log("Build completed.");
