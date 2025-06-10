import { defineConfig } from "playwright/test";

export default defineConfig({
  webServer: {
    command: "bun run dev",
    url: "http://localhost:4321"
  }
});
