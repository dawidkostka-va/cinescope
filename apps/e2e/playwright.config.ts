import { defineConfig, devices } from '@playwright/test';
import { TIMEZONE } from './src/mocks/clock.js';

/**
 * The application under test and `json-server` are started by hand: the serve command
 * differs between the Angular and the React variant, so there is deliberately no
 * `webServer` block here.
 */
export default defineConfig({
  testDir: './src/routes',
  globalSetup: './src/global-setup.ts',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [['list'], ['json', { outputFile: 'results.json' }]],
  use: {
    baseURL: 'http://localhost:4200',
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    // The clock is frozen per test in `src/utils/test.ts`; the zone makes that instant a fixed local day.
    timezoneId: TIMEZONE,
    locale: 'en-US',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
