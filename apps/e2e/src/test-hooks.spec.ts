import { expect, test, type Page } from '@playwright/test';
import { ROWS } from './support/auditorium.js';
import {
  bookSeats,
  confirmToCheckout,
  fillCustomerForm,
  freeSeat,
  mockReservation,
} from './support/flows.js';
import { routes, testIds } from './support/selectors.js';

async function expectPresent(page: Page, ids: string[]): Promise<void> {
  for (const id of ids) {
    await expect(page.getByTestId(id).first(), id).toBeAttached();
  }
}

test.describe('Test hooks', () => {
  test('AC-51: Every data-testid and data attribute in the "Test hooks" table is present with the exact names and values given there', async ({
    page,
  }) => {
    await page.goto(routes.movieList);
    await expectPresent(page, [
      testIds.movieList,
      'movie-card',
      testIds.movieTitle,
      testIds.movieGenre,
      testIds.movieRuntime,
      testIds.movieFormat,
      'screening-button',
    ]);
    await expect(page.locator('[data-testid="movie-card"][data-movie-id]').first()).toBeAttached();
    await expect(
      page.locator('[data-testid="screening-button"][data-screening-id]').first(),
    ).toBeAttached();

    const column = freeSeat(7);
    await bookSeats(page, [{ row: 7, column }]);
    // bookSeats lands on the summary; step back to check the seat map's own hooks.
    await page.getByTestId(testIds.backButton).click();
    await expectPresent(page, [
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
      testIds.cancelButton,
      testIds.continueButton,
    ]);
    await expect(page.locator('[data-testid="seat-row"][data-row]')).toHaveCount(ROWS);
    await expect(
      page.locator('[data-testid="seat"][data-row][data-column][data-state]').first(),
    ).toBeAttached();
    await expect(
      page
        .locator('[data-testid="couch"][data-row][data-column-start][data-column-end][data-state]')
        .first(),
    ).toBeAttached();

    await page.getByTestId(testIds.continueButton).click();
    await expectPresent(page, [
      testIds.summaryList,
      testIds.summaryItem,
      testIds.summaryItemTitle,
      testIds.summaryItemDatetime,
      testIds.summaryItemRow,
      testIds.summaryItemSeat,
      testIds.summaryItemPrice,
      testIds.summaryTotal,
      testIds.backButton,
      testIds.confirmButton,
    ]);

    await confirmToCheckout(page);
    await expectPresent(page, [
      testIds.firstNameInput,
      testIds.lastNameInput,
      testIds.emailInput,
      testIds.confirmEmailInput,
      testIds.phoneInput,
      testIds.termsCheckbox,
      testIds.payButton,
    ]);

    // The error hooks only exist once the form has been submitted invalid.
    await page.getByTestId(testIds.payButton).click();
    await expectPresent(page, [
      testIds.toast,
      testIds.firstNameError,
      testIds.lastNameError,
      testIds.emailError,
      testIds.confirmEmailError,
      testIds.termsError,
    ]);
    await page.getByTestId(testIds.phoneInput).fill('123');
    await page.getByTestId(testIds.emailInput).click();
    await expectPresent(page, [testIds.phoneError]);

    await mockReservation(page, 201);
    await fillCustomerForm(page);
    await page.getByTestId(testIds.payButton).click();
    await expectPresent(page, [
      testIds.confirmationHeading,
      testIds.confirmationMessage,
      testIds.confirmationContinueButton,
    ]);
  });
});
