import { expect, type Locator, type Page } from '@playwright/test';
import { COUCH_ROW, seatId } from './auditorium.js';
import { DEFAULT_SCREENING_ID, screening } from './fixture.js';
import { couch, routes, seat, testIds } from './selectors.js';

export interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export const VALID_CUSTOMER: CustomerForm = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna.kowalska@example.com',
  confirmEmail: 'anna.kowalska@example.com',
  phone: '123456789',
  terms: true,
};

export async function openSeatMap(page: Page, screeningId = DEFAULT_SCREENING_ID): Promise<void> {
  await page.goto(routes.seats(screeningId));
  await expect(page.getByTestId(testIds.seatMap)).toBeVisible();
}

export async function selectSeat(page: Page, row: number, column: number): Promise<void> {
  await seat(page, row, column).click();
}

export async function selectCouch(page: Page, columnStart: number): Promise<void> {
  await couch(page, columnStart).click();
}

export async function continueToSummary(page: Page): Promise<void> {
  await page.getByTestId(testIds.continueButton).click();
  await expect(page.getByTestId(testIds.summaryList)).toBeVisible();
}

export async function confirmToCheckout(page: Page): Promise<void> {
  await page.getByTestId(testIds.confirmButton).click();
  await expect(page.getByTestId(testIds.payButton)).toBeVisible();
}

/** Seat map → summary in one call, for the tests whose subject is the summary or later. */
export async function bookSeats(
  page: Page,
  seats: { row: number; column: number }[],
  screeningId = DEFAULT_SCREENING_ID,
): Promise<void> {
  await openSeatMap(page, screeningId);
  for (const { row, column } of seats) {
    await selectSeat(page, row, column);
  }
  await continueToSummary(page);
}

export async function fillCustomerForm(
  page: Page,
  customer: Partial<CustomerForm> = {},
): Promise<void> {
  const data = { ...VALID_CUSTOMER, ...customer };
  await page.getByTestId(testIds.firstNameInput).fill(data.firstName);
  await page.getByTestId(testIds.lastNameInput).fill(data.lastName);
  await page.getByTestId(testIds.emailInput).fill(data.email);
  await page.getByTestId(testIds.confirmEmailInput).fill(data.confirmEmail);
  await page.getByTestId(testIds.phoneInput).fill(data.phone);
  if (data.terms) await page.getByTestId(testIds.termsCheckbox).check();
}

/**
 * Intercepts `POST /reservations`.
 *
 * The suite never lets a reservation reach `json-server`: a real POST rewrites `db.json`,
 * and the next run would be measured against a fixture the specification does not describe.
 */
export async function mockReservation(page: Page, status: number): Promise<void> {
  await page.route('**/reservations', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(status === 201 ? { id: 1 } : { error: 'failed' }),
    });
  });
}

/** Fails every request for the movie collection, for the error-state criterion. */
export async function failMovies(page: Page): Promise<void> {
  await page.route('**/movies*', (route) => route.abort('failed'));
}

export function toast(page: Page): Locator {
  return page.getByTestId(testIds.toast);
}

/** Seats of the default screening that the fixture leaves free, per row. */
export function freeSeatsIn(row: number, screeningId = DEFAULT_SCREENING_ID): number[] {
  const occupied = new Set(screening(screeningId).occupiedSeats);
  const columns = row >= 1 && row <= 10 ? range(5, 24) : range(1, 24);
  return columns.filter((column) => !occupied.has(seatId(row, column)));
}

/** Couch start columns of the default screening that the fixture leaves free. */
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
  if (column === undefined) {
    throw new Error(`No free couch at index ${String(index)}`);
  }
  return column;
}

/** `boundingBox()` is nullable for detached elements; the specs only call it on visible ones. */
export async function boxOf(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Element has no bounding box');
  return box;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}
