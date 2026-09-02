import { expect, test } from '@playwright/test';
import { ACCESSIBLE, PRICES } from './support/auditorium.js';
import {
  bookSeats,
  continueToSummary,
  freeCouchStart,
  freeSeat,
  openSeatMap,
  selectCouch,
} from './support/flows.js';
import { testIds } from './support/selectors.js';

/** The specification prints every price with two decimals and the PLN suffix. */
function formatted(price: number): string {
  return `${price.toFixed(2)} PLN`;
}

test.describe('Pricing', () => {
  test('AC-28: Seats in rows 1–5 cost 25.00 PLN', async ({ page }) => {
    await bookSeats(page, [{ row: 3, column: freeSeat(3) }]);
    await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatted(PRICES.front));
  });

  test('AC-29: Seats in rows 6–10 cost 32.00 PLN', async ({ page }) => {
    await bookSeats(page, [{ row: 7, column: freeSeat(7) }]);
    await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatted(PRICES.middle));
  });

  test('AC-30: Seats in rows 11–14 cost 39.00 PLN', async ({ page }) => {
    await bookSeats(page, [{ row: 12, column: freeSeat(12) }]);
    await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatted(PRICES.back));
  });

  test('AC-31: A couch costs 89.00 PLN per couch, not per seat', async ({ page }) => {
    await openSeatMap(page);
    await selectCouch(page, freeCouchStart());
    await continueToSummary(page);

    await expect(page.getByTestId(testIds.summaryItem)).toHaveCount(1);
    await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatted(PRICES.couch));
    await expect(page.getByTestId(testIds.summaryTotal)).toContainText(formatted(PRICES.couch));
  });

  test('AC-32: Accessible seats cost 25.00 PLN, like the rest of row 1', async ({ page }) => {
    await bookSeats(page, [{ row: ACCESSIBLE.row, column: ACCESSIBLE.columns.from }]);
    await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatted(PRICES.front));
  });
});
