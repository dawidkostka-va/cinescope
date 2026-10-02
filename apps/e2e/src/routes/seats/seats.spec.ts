import {
  ACCESSIBLE,
  accessibleColumns,
  columnsInRow,
  COUCH_ROW,
  couchPairs,
  EXPECTED_COUCHES,
  EXPECTED_SELECTABLE_ELEMENTS,
  EXPECTED_SINGLE_SEATS,
  MAX_SEATS_PER_BOOKING,
  parseSeatId,
  ROWS,
} from '../../mocks/auditorium.js';
import { DEFAULT_SCREENING_ID, screening } from '../../mocks/fixture.js';
import { TEXTS } from '../../mocks/messages.js';
import { paintedWith, RGB } from '../../utils/colors.js';
import { showDate } from '../../utils/dates.js';
import { boxOf, centerX, textBoxOf } from '../../utils/geometry.js';
import { expectPresent, expectWithAttributes } from '../../utils/identifiers.js';
import { byTestId, routes, testIds, urlOf } from '../../utils/selectors.js';
import { expect, test } from '../../utils/test.js';
import { toast } from '../../utils/toast.js';
import {
  couch,
  couchesInState,
  freeCouchStart,
  freeCouchStarts,
  freeSeat,
  freeSeats,
  openSeatMap,
  rowLocator,
  seat,
  seatsInState,
  selectCouch,
  selectedSeatsRow,
  selectSeat,
} from './seats.utils.js';

test.beforeEach(async ({ page }) => {
  await openSeatMap(page);
});

test.describe('Seat selection — /screenings/:id/seats', () => {
  test.describe('Auditorium geometry', () => {
    test('AC-05: The seat map has 15 rows, numbered 1 to 15, row 1 rendered directly under the screen', async ({
      page,
    }) => {
      await expect(page.getByTestId(testIds.seatRow)).toHaveCount(ROWS);
      for (let row = 1; row <= ROWS; row++) {
        await expect(rowLocator(page, row)).toBeVisible();
      }
      const rowOrder = await page
        .getByTestId(testIds.seatRow)
        .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('data-row'))));
      expect(rowOrder).toEqual(Array.from({ length: ROWS }, (_, index) => index + 1));
      const first = await boxOf(rowLocator(page, 1));
      const last = await boxOf(rowLocator(page, ROWS));
      expect(first.y).toBeLessThan(last.y);
    });

    test('AC-06: Rows 11 to 15 contain 24 columns; rows 1 to 10 contain columns 5 to 24 only', async ({
      page,
    }) => {
      for (let row = 1; row <= ROWS; row++) {
        const expected = columnsInRow(row).length;
        const seats = await rowLocator(page, row).getByTestId(testIds.seat).count();
        const couches = await rowLocator(page, row).getByTestId(testIds.couch).count();
        expect(seats + couches * 2, `row ${String(row)} width`).toBe(expected);
      }
    });

    test('AC-07: A two-seat-wide gap is rendered between columns 4 and 5 and between columns 20 and 21 in every row; gaps carry no seat and no number', async ({
      page,
    }) => {
      for (let row = 1; row <= ROWS; row++) {
        const aisles = rowLocator(page, row).getByTestId(testIds.aisle);
        await expect(aisles, `row ${String(row)}`).toHaveCount(2);
        await expect(aisles.first()).toHaveText('');
        await expect(aisles.last()).toHaveText('');
      }
    });

    test('AC-08: Column numbering is global 1–24 and identical across rows; in rows 1–10, numbering starts at 5', async ({
      page,
    }) => {
      for (const row of [1, 10, 11, 14]) {
        const columns = await rowLocator(page, row)
          .getByTestId(testIds.seat)
          .evaluateAll((nodes) =>
            nodes.map((node) => Number(node.getAttribute('data-column'))).sort((a, b) => a - b),
          );
        expect(columns, `row ${String(row)} columns`).toEqual(columnsInRow(row));
      }
      // Global numbering: column 12 sits at the same x in a row with and without the left block.
      const inShortRow = await boxOf(seat(page, 10, 12));
      const inFullRow = await boxOf(seat(page, 11, 12));
      expect(Math.abs(centerX(inShortRow) - centerX(inFullRow))).toBeLessThanOrEqual(2);
    });

    test('AC-09: The row number is rendered on both the left and the right edge of every row', async ({
      page,
    }) => {
      for (let row = 1; row <= ROWS; row++) {
        await expect(byTestId(page, testIds.rowLabelLeft, { row })).toHaveText(String(row));
        await expect(byTestId(page, testIds.rowLabelRight, { row })).toHaveText(String(row));
      }
    });

    test('AC-10: Every seat renders its column number', async ({ page }) => {
      const mismatches = await page
        .getByTestId(testIds.seat)
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => node.textContent.trim() !== (node.getAttribute('data-column') ?? ''))
            .map((node) => `${node.getAttribute('data-row') ?? '?'}/${node.getAttribute('data-column') ?? '?'}`),
        );
      expect(mismatches).toEqual([]);
    });

    test('AC-11: A SCREEN indicator is rendered above row 1', async ({ page }) => {
      const screen = page.getByTestId(testIds.screenIndicator);
      await expect(screen).toBeVisible();
      await expect(screen).toContainText('SCREEN');

      const screenBox = await boxOf(screen);
      const firstRowBox = await boxOf(rowLocator(page, 1));
      expect(screenBox.y + screenBox.height).toBeLessThanOrEqual(firstRowBox.y + 1);
    });

    test('AC-12: Row 1, columns 10 to 15 are accessible seats — 6 of them', async ({ page }) => {
      await expect(byTestId(page, testIds.seat, { row: 1, state: 'accessible' })).toHaveCount(6);
      for (const column of accessibleColumns()) {
        await expect(seat(page, ACCESSIBLE.row, column)).toHaveAttribute('data-state', 'accessible');
      }
    });

    test('AC-13: Row 15 renders 12 couches, each spanning two adjacent columns: 1–2, 3–4, … 23–24', async ({
      page,
    }) => {
      await expect(page.getByTestId(testIds.couch)).toHaveCount(EXPECTED_COUCHES);
      for (const [start, end] of couchPairs()) {
        const element = couch(page, start);
        await expect(element).toHaveAttribute('data-row', String(COUCH_ROW));
        await expect(element).toHaveAttribute('data-column-end', String(end));
      }
    });

    test('AC-14: A couch is rendered as one wide element, visually distinct from a single seat', async ({
      page,
    }) => {
      const couchBox = await boxOf(couch(page, 1));
      const seatBox = await boxOf(seat(page, 12, 1));
      expect(couchBox.width).toBeGreaterThan(seatBox.width * 1.5);
    });

    test('AC-15: The total number of selectable elements in the auditorium is 308 (200 seats in rows 1–10, 96 in rows 11–14, 12 couches in row 15)', async ({
      page,
    }) => {
      const seats = await page.getByTestId(testIds.seat).count();
      const couches = await page.getByTestId(testIds.couch).count();
      expect(seats).toBe(EXPECTED_SINGLE_SEATS);
      expect(couches).toBe(EXPECTED_COUCHES);
      expect(seats + couches).toBe(EXPECTED_SELECTABLE_ELEMENTS);
    });

    test('AC-56: The seat selection shows the title Choose your seats and the subtitle Show Date: <Weekday> <D> <Mon> <HH:mm> of the screening', async ({
      page,
    }) => {
      await expect(page.getByTestId(testIds.seatMapTitle)).toHaveText(TEXTS.seatMapTitle);
      await expect(page.getByTestId(testIds.seatMapSubtitle)).toHaveText(
        `Show Date: ${showDate(screening(DEFAULT_SCREENING_ID))}`,
      );

      await openSeatMap(page, 7);
      await expect(page.getByTestId(testIds.seatMapSubtitle)).toHaveText(
        `Show Date: ${showDate(screening(7))}`,
      );
    });

    test('AC-57: Above the seat map, horizontally centred over it, the text You can reserve up to 10 seats per reservation is shown', async ({
      page,
    }) => {
      const info = page.getByTestId(testIds.seatLimitInfo);
      await expect(info).toHaveText(TEXTS.seatLimitInfo);

      const text = await textBoxOf(info);
      const map = await boxOf(page.getByTestId(testIds.seatMap));
      expect(text.y + text.height, 'above the seat map').toBeLessThanOrEqual(map.y + 1);
      expect(Math.abs(centerX(text) - centerX(map)), 'centred over the seat map').toBeLessThanOrEqual(24);
    });
  });

  test.describe('Selecting seats', () => {
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
      const target = seat(page, 7, freeSeat(7));
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
      for (let index = 0; index < MAX_SEATS_PER_BOOKING / 2; index++) {
        await selectCouch(page, freeCouchStart(index));
      }
      await expect(couchesInState(page, 'selected')).toHaveCount(5);

      // Five couches are ten seats: no single seat can be added on top.
      const column = freeSeat(7);
      await selectSeat(page, 7, column);
      await expect(seat(page, 7, column)).toHaveAttribute('data-state', 'available');
    });

    test('AC-21: A click that would exceed 10 seats is ignored and shows the toast Maximum 10 seats per booking', async ({
      page,
    }) => {
      for (const column of freeSeats(7, MAX_SEATS_PER_BOOKING)) {
        await selectSeat(page, 7, column);
      }
      const extra = freeSeat(7, MAX_SEATS_PER_BOOKING);
      await selectSeat(page, 7, extra);

      await expect(toast(page)).toContainText(TEXTS.seatLimitToast);
      await expect(seat(page, 7, extra)).toHaveAttribute('data-state', 'available');
      await expect(seatsInState(page, 'selected')).toHaveCount(MAX_SEATS_PER_BOOKING);
    });

    test('AC-22: At the cap, already selected seats and couches can still be deselected', async ({
      page,
    }) => {
      const start = freeCouchStart();
      await selectCouch(page, start);
      for (const column of freeSeats(7, MAX_SEATS_PER_BOOKING - 2)) {
        await selectSeat(page, 7, column);
      }
      const first = freeSeat(7);
      await selectSeat(page, 7, first);
      await expect(seat(page, 7, first)).toHaveAttribute('data-state', 'available');
      await selectCouch(page, start);
      await expect(couch(page, start)).toHaveAttribute('data-state', 'available');
      await expect(seatsInState(page, 'selected')).toHaveCount(MAX_SEATS_PER_BOOKING - 3);
    });

    test('AC-58: Between the seat map and the Cancel / Continue buttons, the selected-seats panel shows Selected seats: <n> and one Row <r>: <seats> line per row, updated on every selection change', async ({
      page,
    }) => {
      const count = page.getByTestId(testIds.selectedSeatsCount);
      const lines = page.getByTestId(testIds.selectedSeatsRow);
      await expect(count).toHaveText('Selected seats: 0');
      await expect(lines).toHaveCount(0);

      const [a, b] = freeSeats(7, 2);
      const start = freeCouchStart();
      // Deliberately out of order: the panel sorts by row, then by column.
      await selectCouch(page, start);
      await selectSeat(page, 7, Number(b));
      await selectSeat(page, 7, Number(a));

      await expect(count).toHaveText('Selected seats: 4');
      await expect(lines).toHaveCount(2);
      await expect(lines.first()).toHaveAttribute('data-row', '7');
      await expect(selectedSeatsRow(page, 7)).toHaveText(`Row 7: ${String(a)}, ${String(b)}`);
      await expect(selectedSeatsRow(page, COUCH_ROW)).toHaveText(
        `Row 15: ${String(start)}-${String(start + 1)}`,
      );

      await selectSeat(page, 7, Number(a));
      await expect(count).toHaveText('Selected seats: 3');
      await expect(selectedSeatsRow(page, 7)).toHaveText(`Row 7: ${String(b)}`);

      const panel = await boxOf(page.getByTestId(testIds.selectedSeats));
      const map = await boxOf(page.getByTestId(testIds.seatMap));
      const buttons = await boxOf(page.getByTestId(testIds.continueButton));
      expect(panel.y, 'below the seat map').toBeGreaterThanOrEqual(map.y + map.height - 1);
      expect(panel.y + panel.height, 'above the buttons').toBeLessThanOrEqual(buttons.y + 1);
    });
  });

  test.describe('Legend and colours', () => {
    test('AC-23: The legend lists exactly Available, Selected, Unavailable, Accessible', async ({
      page,
    }) => {
      const legend = page.getByTestId(testIds.legend);
      await expect(legend).toBeVisible();
      await expect(legend.getByTestId(testIds.legendItem)).toHaveCount(4);
      for (const [state, label] of [
        ['available', 'Available'],
        ['selected', 'Selected'],
        ['unavailable', 'Unavailable'],
        ['accessible', 'Accessible'],
      ] as const) {
        await expect(byTestId(legend, testIds.legendItem, { state })).toContainText(label);
      }
    });

    test('AC-24: Available seats use #2E7D32', async ({ page }) => {
      expect(await paintedWith(seat(page, 7, freeSeat(7)), RGB.available)).toBe(true);
    });

    test('AC-25: Selected seats use #F9A825', async ({ page }) => {
      const column = freeSeat(7);
      await selectSeat(page, 7, column);
      await expect(seat(page, 7, column)).toHaveAttribute('data-state', 'selected');
      expect(await paintedWith(seat(page, 7, column), RGB.selected)).toBe(true);
    });

    test('AC-26: Unavailable seats use #C62828', async ({ page }) => {
      // R3C7 is occupied in the fixture for the default screening.
      expect(await paintedWith(seat(page, 3, 7), RGB.unavailable)).toBe(true);
    });

    test('AC-27: Accessible seats use #1565C0', async ({ page }) => {
      expect(
        await paintedWith(seat(page, ACCESSIBLE.row, ACCESSIBLE.columns.from), RGB.accessible),
      ).toBe(true);
    });
  });

  test.describe('Navigation from the seat map', () => {
    test('AC-33: Cancel navigates to / and clears the selection', async ({ page }) => {
      const column = freeSeat(7);
      await selectSeat(page, 7, column);

      await page.getByTestId(testIds.cancelButton).click();
      await expect(page.getByTestId(testIds.dayPicker)).toBeVisible();
      await expect(page).toHaveURL(urlOf('/'));

      await openSeatMap(page);
      await expect(seat(page, 7, column)).toHaveAttribute('data-state', 'available');
    });

    test('AC-34: Continue navigates to /screenings/:id/summary', async ({ page }) => {
      await selectSeat(page, 7, freeSeat(7));
      await page.getByTestId(testIds.continueButton).click();
      await expect(page).toHaveURL(urlOf(routes.summary(DEFAULT_SCREENING_ID)));
    });

    test('AC-35: Continue does nothing when no seat is selected', async ({ page }) => {
      await page.getByTestId(testIds.continueButton).click({ force: true });
      await expect(page).toHaveURL(urlOf(routes.seats(DEFAULT_SCREENING_ID)));
      await expect(page.getByTestId(testIds.seatMap)).toBeVisible();
    });
  });

  test('AC-66: Every seat-selection identifier in section 9.2, and the toast identifier in section 9.6, is present with the exact names and values given there', async ({
    page,
  }) => {
    await selectCouch(page, freeCouchStart());
    await expectPresent(page, [
      testIds.seatMapTitle,
      testIds.seatMapSubtitle,
      testIds.seatLimitInfo,
      testIds.screenIndicator,
      testIds.seatMap,
      testIds.seatRow,
      testIds.rowLabelLeft,
      testIds.rowLabelRight,
      testIds.aisle,
      testIds.seat,
      testIds.couch,
      testIds.legend,
      testIds.legendItem,
      testIds.selectedSeats,
      testIds.selectedSeatsCount,
      testIds.selectedSeatsRow,
      testIds.cancelButton,
      testIds.continueButton,
    ]);
    await expect(page.locator('[data-testid="seat-row"][data-row]')).toHaveCount(ROWS);
    await expectWithAttributes(page, testIds.rowLabelLeft, ['data-row']);
    await expectWithAttributes(page, testIds.rowLabelRight, ['data-row']);
    await expectWithAttributes(page, testIds.aisle, ['data-row']);
    await expectWithAttributes(page, testIds.seat, ['data-row', 'data-column', 'data-state']);
    await expectWithAttributes(page, testIds.couch, [
      'data-row',
      'data-column-start',
      'data-column-end',
      'data-state',
    ]);
    await expectWithAttributes(page, testIds.legendItem, ['data-state']);
    await expectWithAttributes(page, testIds.selectedSeatsRow, ['data-row']);

    for (const column of freeSeats(7, MAX_SEATS_PER_BOOKING - 1)) {
      await selectSeat(page, 7, column);
    }
    await expectPresent(page, [testIds.toast]);
  });
});
