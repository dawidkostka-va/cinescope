import { expect, test } from '@playwright/test';
import { COUCH_ROW, MAX_SEATS_PER_BOOKING, parseSeatId, TOASTS } from './support/auditorium.js';
import { screening, DEFAULT_SCREENING_ID } from './support/fixture.js';
import {
  freeCouchStart,
  freeCouchStarts,
  freeSeat,
  freeSeats,
  openSeatMap,
  selectCouch,
  selectSeat,
  toast,
} from './support/flows.js';
import { couch, seat, testIds } from './support/selectors.js';

test.beforeEach(async ({ page }) => {
  await openSeatMap(page);
});

test.describe('Seat selection', () => {
  test('AC-16: Seats listed in occupiedSeats for the screening are rendered unavailable and cannot be selected', async ({
    page,
  }) => {
    const singles = screening(DEFAULT_SCREENING_ID).occupiedSeats.filter(
      (id) => !id.startsWith(`R${String(COUCH_ROW)}C`),
    );
    for (const id of singles) {
      const { row, column } = parseSeatId(id);
      const target = seat(page, row, column);
      await expect(target, id).toHaveAttribute('data-state', 'unavailable');
      await target.click({ force: true });
      await expect(target, id).toHaveAttribute('data-state', 'unavailable');
    }
  });

  test('AC-17: A couch is unavailable when either of its two seat identifiers is in occupiedSeats', async ({
    page,
  }) => {
    // The fixture takes R15C5 and R15C6 — the couch spanning columns 5-6.
    await expect(couch(page, 5)).toHaveAttribute('data-state', 'unavailable');
    for (const start of freeCouchStarts()) {
      await expect(couch(page, start), `couch ${String(start)}`).not.toHaveAttribute(
        'data-state',
        'unavailable',
      );
    }
  });

  test('AC-18: Clicking an available seat selects it; clicking it again deselects it', async ({
    page,
  }) => {
    const column = freeSeat(7);
    const target = seat(page, 7, column);
    await expect(target).toHaveAttribute('data-state', 'available');
    await target.click();
    await expect(target).toHaveAttribute('data-state', 'selected');
    await target.click();
    await expect(target).toHaveAttribute('data-state', 'available');
  });

  test('AC-19: Clicking a couch selects both of its seats as one unit; it cannot be half-selected', async ({
    page,
  }) => {
    const start = freeCouchStart();
    await selectCouch(page, start);
    await expect(couch(page, start)).toHaveAttribute('data-state', 'selected');
    // A couch is a single element: the two columns it spans never appear as separate seats.
    await expect(seat(page, COUCH_ROW, start)).toHaveCount(0);
    await expect(seat(page, COUCH_ROW, start + 1)).toHaveCount(0);
  });

  test('AC-20: Selection is capped at 10 seats; a couch counts as 2', async ({ page }) => {
    const starts = Array.from({ length: MAX_SEATS_PER_BOOKING / 2 }, (_, index) => freeCouchStart(index));
    for (const start of starts) {
      await selectCouch(page, start);
    }
    await expect(page.locator(`[data-testid="${testIds.couch}"][data-state="selected"]`)).toHaveCount(
      5,
    );

    // Five couches are ten seats: no single seat can be added on top.
    const column = freeSeat(7);
    await selectSeat(page, 7, column);
    await expect(seat(page, 7, column)).toHaveAttribute('data-state', 'available');
  });

  test('AC-21: A click that would exceed 10 seats is ignored and shows the toast Maximum 10 seats per booking', async ({
    page,
  }) => {
    const columns = freeSeats(7, MAX_SEATS_PER_BOOKING);
    for (const column of columns) {
      await selectSeat(page, 7, column);
    }
    const extra = freeSeat(7, MAX_SEATS_PER_BOOKING);
    await selectSeat(page, 7, extra);

    await expect(toast(page)).toContainText(TOASTS.seatLimit);
    await expect(seat(page, 7, extra)).toHaveAttribute('data-state', 'available');
    await expect(page.locator(`[data-testid="${testIds.seat}"][data-state="selected"]`)).toHaveCount(
      MAX_SEATS_PER_BOOKING,
    );
  });

  test('AC-22: At the cap, already selected seats and couches can still be deselected', async ({
    page,
  }) => {
    const columns = freeSeats(7, MAX_SEATS_PER_BOOKING);
    for (const column of columns) {
      await selectSeat(page, 7, column);
    }
    const first = freeSeat(7);
    await selectSeat(page, 7, first);
    await expect(seat(page, 7, first)).toHaveAttribute('data-state', 'available');
    await expect(page.locator(`[data-testid="${testIds.seat}"][data-state="selected"]`)).toHaveCount(
      MAX_SEATS_PER_BOOKING - 1,
    );
  });
});
