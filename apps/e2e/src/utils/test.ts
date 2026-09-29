import { test as base } from '@playwright/test';
import { NOW } from '../mocks/clock.js';

/**
 * Every test runs with the browser clock frozen at {@link NOW}; timers keep running, so
 * toasts still disappear. Import `test` and `expect` from here, never from Playwright.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(NOW);
    await use(page);
  },
});

export { expect } from '@playwright/test';
