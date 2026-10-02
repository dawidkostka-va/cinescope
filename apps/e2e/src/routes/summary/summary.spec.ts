import { ACCESSIBLE, formatPrice, PRICES } from '../../mocks/auditorium.js';
import { DEFAULT_SCREENING_ID, movieOf, screening } from '../../mocks/fixture.js';
import { TEXTS } from '../../mocks/messages.js';
import { expectPresent } from '../../utils/identifiers.js';
import { routes, testIds, urlOf } from '../../utils/selectors.js';
import { expect, test } from '../../utils/test.js';
import { continueToSummary, freeCouchStart, freeSeat, seat, selectCouch, selectSeat } from '../seats/seats.utils.js';
import { bookSeats, summaryItems } from './summary.utils.js';

const target = screening(DEFAULT_SCREENING_ID);
const movie = movieOf(target);

test.describe('Summary — /screenings/:id/summary', () => {
  test.describe('Pricing', () => {
    test('AC-28: Seats in rows 1–5 cost 25.00 PLN', async ({ page }) => {
      await bookSeats(page, { seats: [{ row: 3, column: freeSeat(3) }] });
      await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatPrice(PRICES.front));
    });

    test('AC-29: Seats in rows 6–10 cost 32.00 PLN', async ({ page }) => {
      await bookSeats(page, { seats: [{ row: 7, column: freeSeat(7) }] });
      await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatPrice(PRICES.middle));
    });

    test('AC-30: Seats in rows 11–14 cost 39.00 PLN', async ({ page }) => {
      await bookSeats(page, { seats: [{ row: 12, column: freeSeat(12) }] });
      await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatPrice(PRICES.back));
    });

    test('AC-31: A couch costs 89.00 PLN per couch, not per seat', async ({ page }) => {
      await bookSeats(page, { couches: [freeCouchStart()] });
      await expect(summaryItems(page)).toHaveCount(1);
      await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatPrice(PRICES.couch));
      await expect(page.getByTestId(testIds.summaryTotal)).toContainText(formatPrice(PRICES.couch));
    });

    test('AC-32: Accessible seats cost 25.00 PLN, like the rest of row 1', async ({ page }) => {
      await bookSeats(page, { seats: [{ row: ACCESSIBLE.row, column: ACCESSIBLE.columns.from }] });
      await expect(page.getByTestId(testIds.summaryItemPrice)).toHaveText(formatPrice(PRICES.front));
    });
  });

  test('AC-36: Each selected item is listed with movie title, screening date, time, row number, seat description and price', async ({
    page,
  }) => {
    const column = freeSeat(7);
    await bookSeats(page, { seats: [{ row: 7, column }] });

    const item = summaryItems(page);
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
    await bookSeats(page, { couches: [start] });
    await expect(page.getByTestId(testIds.summaryItemSeat)).toHaveText(
      `Couch ${String(start)}-${String(start + 1)}`,
    );

    // The booking persists, so swap the couch for a single seat on the same seat map.
    await page.getByTestId(testIds.backButton).click();
    await selectCouch(page, start);
    const column = freeSeat(7);
    await selectSeat(page, 7, column);
    await continueToSummary(page);
    await expect(page.getByTestId(testIds.summaryItemSeat)).toHaveText(String(column));
  });

  test('AC-38: The total line reads Total: <sum> PLN and equals the sum of the listed prices', async ({
    page,
  }) => {
    await bookSeats(page, {
      seats: [
        { row: 3, column: freeSeat(3, 0) },
        { row: 3, column: freeSeat(3, 1) },
        { row: 12, column: freeSeat(12) },
      ],
    });
    await expect(page.getByTestId(testIds.summaryTotal)).toHaveText(
      `Total: ${formatPrice(PRICES.front * 2 + PRICES.back)}`,
    );
  });

  test('AC-39: Back returns to the seat map with the selection intact', async ({ page }) => {
    const column = freeSeat(7);
    await bookSeats(page, { seats: [{ row: 7, column }] });

    await page.getByTestId(testIds.backButton).click();
    await expect(page).toHaveURL(urlOf(routes.seats(DEFAULT_SCREENING_ID)));
    await expect(seat(page, 7, column)).toHaveAttribute('data-state', 'selected');
  });

  test('AC-40: Confirm navigates to /screenings/:id/checkout', async ({ page }) => {
    await bookSeats(page, { seats: [{ row: 7, column: freeSeat(7) }] });
    await page.getByTestId(testIds.confirmButton).click();
    await expect(page).toHaveURL(urlOf(routes.checkout(DEFAULT_SCREENING_ID)));
  });

  test('AC-59: The summary shows the title Your tickets', async ({ page }) => {
    await bookSeats(page, { seats: [{ row: 7, column: freeSeat(7) }] });
    await expect(page.getByTestId(testIds.summaryTitle)).toHaveText(TEXTS.summaryTitle);
  });

  test('AC-60: Each summary item has a Remove button that removes it from the booking and updates the total; removing the last item returns to the seat map', async ({
    page,
  }) => {
    const [first, second] = [freeSeat(7, 0), freeSeat(7, 1)];
    const start = freeCouchStart();
    await bookSeats(page, {
      seats: [
        { row: 7, column: first },
        { row: 7, column: second },
      ],
      couches: [start],
    });
    await expect(summaryItems(page)).toHaveCount(3);
    await expect(summaryItems(page).getByTestId(testIds.summaryItemRemoveButton)).toHaveCount(3);

    // Items are ordered by row, then column: the first one is row 7, `first`.
    await summaryItems(page).first().getByTestId(testIds.summaryItemRemoveButton).click();
    await expect(summaryItems(page)).toHaveCount(2);
    await expect(page.getByTestId(testIds.summaryTotal)).toHaveText(
      `Total: ${formatPrice(PRICES.middle + PRICES.couch)}`,
    );

    // The removal reached the booking, not just the list.
    await page.reload();
    await expect(summaryItems(page)).toHaveCount(2);

    await summaryItems(page).first().getByTestId(testIds.summaryItemRemoveButton).click();
    await summaryItems(page).first().getByTestId(testIds.summaryItemRemoveButton).click();
    await expect(page).toHaveURL(urlOf(routes.seats(DEFAULT_SCREENING_ID)));
    await expect(seat(page, 7, first)).toHaveAttribute('data-state', 'available');
    await expect(seat(page, 7, second)).toHaveAttribute('data-state', 'available');
  });

  test('AC-67: Every summary identifier in section 9.3 is present with the exact names and values given there', async ({
    page,
  }) => {
    await bookSeats(page, { seats: [{ row: 7, column: freeSeat(7) }] });
    await expectPresent(page, [
      testIds.summaryTitle,
      testIds.summaryList,
      testIds.summaryItem,
      testIds.summaryItemTitle,
      testIds.summaryItemDatetime,
      testIds.summaryItemRow,
      testIds.summaryItemSeat,
      testIds.summaryItemPrice,
      testIds.summaryItemRemoveButton,
      testIds.summaryTotal,
      testIds.backButton,
      testIds.confirmButton,
    ]);
  });
});
