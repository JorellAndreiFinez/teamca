import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true, // Enables global variables like describe, it, expect, etc.
    environment: "jsdom", // Changes environment from Node to a simulated browser
    include: ["src/**/*.test.{ts,tsx}"], // Tells Vitest to include React test files
    setupFiles: ["./vitest-setup.ts"], // Loads the custom DOM matchers
    testTimeout: 10000,
  },
});