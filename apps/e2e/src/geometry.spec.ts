import { expect, test } from '@playwright/test';
import {
  ACCESSIBLE,
  accessibleColumns,
  columnsInRow,
  couchPairs,
  COUCH_ROW,
  EXPECTED_SELECTABLE_ELEMENTS,
  ROWS,
} from './support/auditorium.js';
import { boxOf, openSeatMap } from './support/flows.js';
import { couch, rowLocator, seat, testIds } from './support/selectors.js';

test.beforeEach(async ({ page }) => {
  await openSeatMap(page);
});

test.describe('Auditorium geometry', () => {
  test('AC-05: The seat map has 15 rows, numbered 1 to 15, row 1 rendered directly under the screen', async ({
    page,
  }) => {
    await expect(page.getByTestId(testIds.seatRow)).toHaveCount(ROWS);
    for (let row = 1; row <= ROWS; row++) {
      await expect(rowLocator(page, row)).toBeVisible();
    }
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

  test('AC-07: A two-seat-wide gap is rendered between columns 4 and 5 and between columns 20 and 21; gaps carry no seat and no number', async ({
    page,
  }) => {
    for (let row = 1; row <= ROWS; row++) {
      await expect(rowLocator(page, row).getByTestId(testIds.aisle)).toHaveCount(2);
    }
    await expect(page.getByTestId(testIds.aisle).first()).toHaveText('');
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
  });

  test('AC-09: The row number is rendered on both the left and the right edge of every row', async ({
    page,
  }) => {
    for (let row = 1; row <= ROWS; row++) {
      const left = page.locator(
        `[data-testid="${testIds.rowLabelLeft}"][data-row="${String(row)}"]`,
      );
      const right = page.locator(
        `[data-testid="${testIds.rowLabelRight}"][data-row="${String(row)}"]`,
      );
      await expect(left).toHaveText(String(row));
      await expect(right).toHaveText(String(row));
    }
  });

  test('AC-10: Every seat renders its column number', async ({ page }) => {
    const mismatches = await page
      .getByTestId(testIds.seat)
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => !node.textContent.includes(node.getAttribute('data-column') ?? ''))
          .map((node) => `${node.getAttribute('data-row') ?? '?'}/${node.getAttribute('data-column') ?? '?'}`),
      );
    expect(mismatches).toEqual([]);
  });

  test('AC-11: A SCREEN indicator is rendered above row 1', async ({ page }) => {
    const screen = page.getByTestId(testIds.screenIndicator);
    await expect(screen).toBeVisible();
    await expect(screen).toContainText(/screen/i);

    const screenBox = await boxOf(screen);
    const firstRowBox = await boxOf(rowLocator(page, 1));
    expect(screenBox.y + screenBox.height).toBeLessThanOrEqual(firstRowBox.y + 1);
  });

  test('AC-12: Row 1, columns 10 to 15 are accessible seats — 6 of them', async ({ page }) => {
    const accessible = page.locator(
      `[data-testid="${testIds.seat}"][data-row="1"][data-state="accessible"]`,
    );
    await expect(accessible).toHaveCount(6);
    for (const column of accessibleColumns()) {
      await expect(seat(page, ACCESSIBLE.row, column)).toHaveAttribute('data-state', 'accessible');
    }
  });

  test('AC-13: Row 15 renders 12 couches, each spanning two adjacent columns: 1–2, 3–4, … 23–24', async ({
    page,
  }) => {
    await expect(page.getByTestId(testIds.couch)).toHaveCount(12);
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
    expect(seats).toBe(296);
    expect(couches).toBe(12);
    expect(seats + couches).toBe(EXPECTED_SELECTABLE_ELEMENTS);
  });
});
