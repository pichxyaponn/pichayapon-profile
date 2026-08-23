import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  use: {
    baseURL: "http://localhost:4321"
  },
  webServer: {
    command: "bun run serve:test",
    url: "http://localhost:4321",
    reuseExistingServer: true
  }
});
