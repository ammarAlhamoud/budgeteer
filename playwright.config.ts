import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:3217', trace: 'retain-on-failure', launchOptions: { executablePath: process.env.CHROMIUM_PATH } },
  webServer: {
    command: 'node scripts/test-server.mjs',
    url: 'http://127.0.0.1:3217/api/categories',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
