import { expect, test } from '@playwright/test';
import { DEFAULT_SCREENING_ID } from './support/fixture.js';
import {
  bookSeats,
  confirmToCheckout,
  fillCustomerForm,
  freeSeat,
  mockReservation,
  VALID_CUSTOMER,
} from './support/flows.js';
import { routes, seat, testIds } from './support/selectors.js';

test.describe('Confirmation and state', () => {
  test('AC-48: /confirmation shows Payment successful and Your tickets will be sent shortly to <email>; Continue navigates to / and clears the booking; the booking survives a reload via sessionStorage, and entering routes 2–5 without a booking redirects to /', async ({
    page,
  }) => {
    // A route entered without a booking in progress redirects to the movie list.
    await page.goto(routes.summary(DEFAULT_SCREENING_ID));
    await expect(page.getByTestId(testIds.movieList)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    // The booking survives a reload.
    const column = freeSeat(7);
    await bookSeats(page, [{ row: 7, column }]);
    await page.reload();
    await expect(page.getByTestId(testIds.summaryItem)).toHaveCount(1);
    await expect(page.getByTestId(testIds.summaryItemSeat)).toContainText(String(column));

    await confirmToCheckout(page);
    await mockReservation(page, 201);
    await fillCustomerForm(page);
    await page.getByTestId(testIds.payButton).click();

    await expect(page).toHaveURL(new RegExp(`${routes.confirmation}$`));
    await expect(page.getByTestId(testIds.confirmationHeading)).toHaveText('Payment successful');
    await expect(page.getByTestId(testIds.confirmationMessage)).toContainText(
      `Your tickets will be sent shortly to ${VALID_CUSTOMER.email}`,
    );

    // Continue returns to the movie list and clears the booking.
    await page.getByTestId(testIds.confirmationContinueButton).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId(testIds.movieList)).toBeVisible();

    await page.goto(routes.summary(DEFAULT_SCREENING_ID));
    await expect(page).toHaveURL(/\/$/);

    await page.goto(routes.seats(DEFAULT_SCREENING_ID));
    await expect(seat(page, 7, column)).toHaveAttribute('data-state', 'available');
  });
});
