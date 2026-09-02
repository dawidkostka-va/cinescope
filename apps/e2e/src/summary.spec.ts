import { expect, test } from '@playwright/test';
import { PRICES } from './support/auditorium.js';
import { DEFAULT_SCREENING_ID, movieOf, screening } from './support/fixture.js';
import {
  bookSeats,
  continueToSummary,
  freeCouchStart,
  freeSeat,
  openSeatMap,
  selectCouch,
} from './support/flows.js';
import { routes, seat, testIds } from './support/selectors.js';

const target = screening(DEFAULT_SCREENING_ID);
const movie = movieOf(target);

test.describe('Summary', () => {
  test('AC-36: Each selected item is listed with movie title, screening date, time, row number, seat description and price', async ({
    page,
  }) => {
    const column = freeSeat(7);
    await bookSeats(page, [{ row: 7, column }]);

    const item = page.getByTestId(testIds.summaryItem);
    await expect(item).toHaveCount(1);
    await expect(item.getByTestId(testIds.summaryItemTitle)).toContainText(movie.title);
    await expect(item.getByTestId(testIds.summaryItemDatetime)).toContainText(target.date);
    await expect(item.getByTestId(testIds.summaryItemDatetime)).toContainText(target.time);
    await expect(item.getByTestId(testIds.summaryItemRow)).toContainText('7');
    await expect(item.getByTestId(testIds.summaryItemSeat)).toContainText(String(column));
    await expect(item.getByTestId(testIds.summaryItemPrice)).toContainText('32.00');
  });

  test('AC-37: A couch is described as Couch <a>-<b>; a single seat is described by its column number', async ({
    page,
  }) => {
    const start = freeCouchStart();
    await openSeatMap(page);
    await selectCouch(page, start);
    await continueToSummary(page);
    await expect(page.getByTestId(testIds.summaryItemSeat)).toHaveText(
      `Couch ${String(start)}-${String(start + 1)}`,
    );

    const column = freeSeat(7);
    await bookSeats(page, [{ row: 7, column }]);
    await expect(page.getByTestId(testIds.summaryItemSeat)).toHaveText(String(column));
  });

  test('AC-38: The total line reads Total: <sum> PLN and equals the sum of the listed prices', async ({
    page,
  }) => {
    await bookSeats(page, [
      { row: 3, column: freeSeat(3, 0) },
      { row: 3, column: freeSeat(3, 1) },
      { row: 12, column: freeSeat(12) },
    ]);

    const expected = PRICES.front * 2 + PRICES.back;
    await expect(page.getByTestId(testIds.summaryTotal)).toHaveText(
      `Total: ${expected.toFixed(2)} PLN`,
    );
  });

  test('AC-39: Back returns to the seat map with the selection intact', async ({ page }) => {
    const column = freeSeat(7);
    await bookSeats(page, [{ row: 7, column }]);

    await page.getByTestId(testIds.backButton).click();
    await expect(page).toHaveURL(new RegExp(`${routes.seats(DEFAULT_SCREENING_ID)}$`));
    await expect(seat(page, 7, column)).toHaveAttribute('data-state', 'selected');
  });

  test('AC-40: Confirm navigates to /screenings/:id/checkout', async ({ page }) => {
    await bookSeats(page, [{ row: 7, column: freeSeat(7) }]);
    await page.getByTestId(testIds.confirmButton).click();
    await expect(page).toHaveURL(new RegExp(`${routes.checkout(DEFAULT_SCREENING_ID)}$`));
  });
});
