import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  base:
    process.env.NODE_ENV === "production" ? "/__BASE_URL_TO_REPLACE__/" : "/",
  plugins: [tailwindcss(), solid()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@frontend": fileURLToPath(new URL("./src", import.meta.url)),
      "@backend": fileURLToPath(new URL("../backend/src", import.meta.url)),
      "~shared": fileURLToPath(new URL("../backend/shared", import.meta.url)),
    },
  },
});
