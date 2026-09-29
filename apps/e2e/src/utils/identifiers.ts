import type { Page } from '@playwright/test';
import { expect } from './test.js';

/** Asserts that at least one element carries each test id. */
export async function expectPresent(page: Page, ids: readonly string[]): Promise<void> {
  for (const id of ids) {
    await expect(page.getByTestId(id).first(), id).toBeAttached();
  }
}

/** Asserts that at least one element carries the test id together with every attribute. */
export async function expectWithAttributes(
  page: Page,
  testId: string,
  attributes: readonly string[],
): Promise<void> {
  const selector = `[data-testid="${testId}"]${attributes.map((name) => `[${name}]`).join('')}`;
  await expect(page.locator(selector).first(), selector).toBeAttached();
}
