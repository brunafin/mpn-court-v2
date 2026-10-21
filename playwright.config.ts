import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

process.env.TZ = "America/Sao_Paulo";

const root = path.dirname(fileURLToPath(import.meta.url));
const apiDir = process.env.E2E_API_DIR || path.resolve(root, "../mpn-api");
const apiUrl = "http://127.0.0.1:3011";
const appUrl = "http://127.0.0.1:5175";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: "list",
  use: {
    baseURL: appUrl,
    timezoneId: "America/Sao_Paulo",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts|login\.spec\.ts|access\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/manager.json",
      },
    },
    {
      name: "fresh",
      dependencies: ["setup"],
      testMatch: /login\.spec\.ts|access\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
  webServer: [
    {
      command: "npm run start:e2e",
      cwd: apiDir,
      url: `${apiUrl}/`,
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5175",
      url: appUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        TZ: "America/Sao_Paulo",
        VITE_API_URL_BASE: apiUrl,
        VITE_ENVIRONMENT: "test",
      },
    },
  ],
});
