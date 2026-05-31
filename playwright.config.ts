import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  use: {
    baseURL: "http://localhost:4321"
  },
  webServer: {
    command: "bun run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI
  }
});
