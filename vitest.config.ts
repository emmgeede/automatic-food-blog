import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{js,ts}"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "astro:content": path.resolve(__dirname, "./src/__mocks__/astro-content.ts"),
    },
  },
});
