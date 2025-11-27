import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'tests/e2e/playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 5000,
    navigationTimeout: 15000,
    // We use an in-page E2E mock injected by tests (window.__E2E_MOCK__),
    // so avoid requiring a storageState file which caused ENOENT errors.
    // storageState: 'tests/e2e/.auth/admin.json'
  },
  // Ensure the dev server is running before tests start
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    cwd: __dirname,
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_E2E: 'true',
      BASE_URL: process.env.BASE_URL || 'http://localhost:3000'
    }
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
