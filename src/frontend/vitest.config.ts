import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the FarmTrack frontend suite.
 *
 * The DOM environment is jsdom and the setup module installs jest-dom matchers
 * plus the small browser shims Radix and the map need under jsdom. The `@`
 * alias mirrors vite.config.js so tests import the same modules the app does.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    // The default threads pool conflicts with the container's thread limits
    // ("options.minThreads and options.maxThreads must not conflict"), so the
    // suite runs in a single forked process instead.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});
