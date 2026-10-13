import { defineConfig, devices } from '@playwright/test'

/**
 * Browser UAT against the deployed dev site — the same clicks a QA tester makes
 * from the UAT checklist, in a real browser, against the real dev database.
 *
 *   DEV_BYPASS_SECRET=<secret> npm run uat:dev:ui
 *   DEV_BYPASS_SECRET=<secret> UAT_BASE_URL=http://localhost:3000 npm run uat:dev:ui
 *
 * Separate from playwright.config.ts on purpose: the main e2e suite targets a local
 * dev server and has drifted; these specs target dev.sheathacademy.com, write only
 * throwaway "ZZ UAT" data, and refuse to run against production (see e2e/uat/helpers.ts).
 */
export default defineConfig({
  testDir: './e2e/uat',
  // Steps within a spec share probe data and run in checklist order.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { outputFolder: 'e2e/results-uat', open: 'never' }]],
  use: {
    baseURL: process.env.UAT_BASE_URL ?? 'https://dev.sheathacademy.com',
    // A missing control should fail fast and name the control, not hang to the test timeout.
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Render runs in UTC and the schedule is computed server-side; keep the browser aligned.
    timezoneId: 'UTC',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
