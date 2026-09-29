import type { Locator, Page } from '@playwright/test';
import { testIds } from './selectors.js';

export function toast(page: Page): Locator {
  return page.getByTestId(testIds.toast);
}
