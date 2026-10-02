import type { Locator, Page } from '@playwright/test';
import { COUCH_ROW, columnsInRow, range, seatId } from '../../mocks/auditorium.js';
import { DEFAULT_SCREENING_ID, screening } from '../../mocks/fixture.js';
import type { SeatPosition, SeatState } from '../../types/index.js';
import { byTestId, routes, testIds } from '../../utils/selectors.js';
import { expect } from '../../utils/test.js';

export async function openSeatMap(page: Page, screeningId = DEFAULT_SCREENING_ID): Promise<void> {
  await page.goto(routes.seats(screeningId));
  await expect(page.getByTestId(testIds.seatMap)).toBeVisible();
}

export function seat(page: Page, row: number, column: number): Locator {
  return byTestId(page, testIds.seat, { row, column });
}

export function couch(page: Page, columnStart: number): Locator {
  return byTestId(page, testIds.couch, { 'column-start': columnStart });
}

export function seatsInState(page: Page, state: SeatState): Locator {
  return byTestId(page, testIds.seat, { state });
}

export function couchesInState(page: Page, state: SeatState): Locator {
  return byTestId(page, testIds.couch, { state });
}

export function rowLocator(page: Page, row: number): Locator {
  return byTestId(page, testIds.seatRow, { row });
}

export async function selectSeat(page: Page, row: number, column: number): Promise<void> {
  await seat(page, row, column).click();
}

export async function selectSeats(page: Page, seats: readonly SeatPosition[]): Promise<void> {
  for (const { row, column } of seats) await selectSeat(page, row, column);
}

export async function selectCouch(page: Page, columnStart: number): Promise<void> {
  await couch(page, columnStart).click();
}

export async function continueToSummary(page: Page): Promise<void> {
  await page.getByTestId(testIds.continueButton).click();
  await expect(page.getByTestId(testIds.summaryList)).toBeVisible();
}

/** Seats of a screening that the fixture leaves free, per row. */
export function freeSeatsIn(row: number, screeningId = DEFAULT_SCREENING_ID): number[] {
  const occupied = new Set(screening(screeningId).occupiedSeats);
  return columnsInRow(row).filter((column) => !occupied.has(seatId(row, column)));
}

/** Couch start columns of a screening that the fixture leaves free. */
export function freeCouchStarts(screeningId = DEFAULT_SCREENING_ID): number[] {
  const occupied = new Set(screening(screeningId).occupiedSeats);
  return range(1, 23)
    .filter((column) => column % 2 === 1)
    .filter(
      (column) =>
        !occupied.has(seatId(COUCH_ROW, column)) && !occupied.has(seatId(COUCH_ROW, column + 1)),
    );
}

/** The n-th free seat of a row, as a plain number — keeps the specs free of `!`. */
export function freeSeat(row: number, index = 0, screeningId = DEFAULT_SCREENING_ID): number {
  const column = freeSeatsIn(row, screeningId)[index];
  if (column === undefined) {
    throw new Error(`Row ${String(row)} has no free seat at index ${String(index)}`);
  }
  return column;
}

export function freeSeats(row: number, count: number, screeningId = DEFAULT_SCREENING_ID): number[] {
  return Array.from({ length: count }, (_, index) => freeSeat(row, index, screeningId));
}

export function freeCouchStart(index = 0, screeningId = DEFAULT_SCREENING_ID): number {
  const column = freeCouchStarts(screeningId)[index];
  if (column === undefined) throw new Error(`No free couch at index ${String(index)}`);
  return column;
}

export function selectedSeatsRow(page: Page, row: number): Locator {
  return byTestId(page, testIds.selectedSeatsRow, { row });
}
