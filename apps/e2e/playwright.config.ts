import { defineConfig, devices } from '@playwright/test';

/**
 * The application under test and `json-server` are started by hand: the serve command
 * differs between the Angular and the React variant, so there is deliberately no
 * `webServer` block here.
 */
export default defineConfig({
  testDir: './src',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [['list'], ['json', { outputFile: 'results.json' }]],
  use: {
    baseURL: 'http://localhost:4200',
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
