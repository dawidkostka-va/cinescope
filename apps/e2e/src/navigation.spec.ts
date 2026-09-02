import { expect, test } from '@playwright/test';
import { DEFAULT_SCREENING_ID } from './support/fixture.js';
import { freeSeat, openSeatMap, selectSeat } from './support/flows.js';
import { routes, seat, testIds } from './support/selectors.js';

test.describe('Navigation from the seat map', () => {
  test('AC-33: Cancel navigates to / and clears the selection', async ({ page }) => {
    await openSeatMap(page);
    const column = freeSeat(7);
    await selectSeat(page, 7, column);

    await page.getByTestId(testIds.cancelButton).click();
    await expect(page.getByTestId(testIds.movieList)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await openSeatMap(page);
    await expect(seat(page, 7, column)).toHaveAttribute('data-state', 'available');
  });

  test('AC-34: Continue navigates to /screenings/:id/summary', async ({ page }) => {
    await openSeatMap(page);
    await selectSeat(page, 7, freeSeat(7));
    await page.getByTestId(testIds.continueButton).click();
    await expect(page).toHaveURL(new RegExp(`${routes.summary(DEFAULT_SCREENING_ID)}$`));
  });

  test('AC-35: Continue does nothing when no seat is selected', async ({ page }) => {
    await openSeatMap(page);
    await page.getByTestId(testIds.continueButton).click({ force: true });
    await expect(page).toHaveURL(new RegExp(`${routes.seats(DEFAULT_SCREENING_ID)}$`));
    await expect(page.getByTestId(testIds.seatMap)).toBeVisible();
  });
});
