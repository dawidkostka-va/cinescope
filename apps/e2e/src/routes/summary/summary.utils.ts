import type { Locator, Page } from '@playwright/test';
import { DEFAULT_SCREENING_ID } from '../../mocks/fixture.js';
import type { SeatPosition } from '../../types/index.js';
import { testIds } from '../../utils/selectors.js';
import { expect } from '../../utils/test.js';
import { continueToSummary, openSeatMap, selectCouch, selectSeats } from '../seats/seats.utils.js';

export interface Selection {
  seats?: readonly SeatPosition[];
  couches?: readonly number[];
}

/** Seat map → summary in one call, for the tests whose subject is the summary or later. */
export async function bookSeats(
  page: Page,
  { seats = [], couches = [] }: Selection,
  screeningId = DEFAULT_SCREENING_ID,
): Promise<void> {
  await openSeatMap(page, screeningId);
  await selectSeats(page, seats);
  for (const start of couches) await selectCouch(page, start);
  await continueToSummary(page);
}

export function summaryItems(page: Page): Locator {
  return page.getByTestId(testIds.summaryItem);
}

export async function confirmToCheckout(page: Page): Promise<void> {
  await page.getByTestId(testIds.confirmButton).click();
  await expect(page.getByTestId(testIds.payButton)).toBeVisible();
}
