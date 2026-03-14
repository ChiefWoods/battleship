import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/game/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "dom",
          environment: "jsdom",
          setupFiles: ["./tests/setup-dom.ts"],
          include: ["tests/dom/**/*.test.ts"],
        },
      },
    ],
  },
});
