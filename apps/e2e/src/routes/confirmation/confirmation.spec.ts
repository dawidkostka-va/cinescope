import { VALID_CUSTOMER } from '../../mocks/customer.js';
import { DEFAULT_SCREENING_ID } from '../../mocks/fixture.js';
import { TEXTS } from '../../mocks/messages.js';
import { expectPresent } from '../../utils/identifiers.js';
import { routes, testIds, urlOf } from '../../utils/selectors.js';
import { expect, test } from '../../utils/test.js';
import { openCheckout } from '../checkout/checkout.utils.js';
import { freeSeat, seat } from '../seats/seats.utils.js';
import { bookSeats, confirmToCheckout, summaryItems } from '../summary/summary.utils.js';
import { payAndConfirm } from './confirmation.utils.js';

test.describe('Confirmation — /confirmation', () => {
  test('AC-48: /confirmation shows Payment successful and Your tickets will be sent shortly to <email>; Continue navigates to / and clears the booking; the booking survives a reload via sessionStorage; entering the summary, checkout or confirmation without a matching booking redirects to /', async ({
    page,
  }) => {
    // Routes entered without a matching booking redirect to the movie list.
    for (const url of [
      routes.summary(DEFAULT_SCREENING_ID),
      routes.checkout(DEFAULT_SCREENING_ID),
      routes.confirmation,
    ]) {
      await page.goto(url);
      await expect(page.getByTestId(testIds.dayPicker), url).toBeVisible();
      await expect(page, url).toHaveURL(urlOf('/'));
    }

    // The booking survives a reload.
    const column = freeSeat(7);
    await bookSeats(page, { seats: [{ row: 7, column }] });
    await page.reload();
    await expect(summaryItems(page)).toHaveCount(1);
    await expect(page.getByTestId(testIds.summaryItemSeat)).toHaveText(String(column));

    // A booking for screening 1 does not open the summary of another screening.
    await page.goto(routes.summary(2));
    await expect(page, 'summary of another screening').toHaveURL(urlOf('/'));

    await page.goto(routes.summary(DEFAULT_SCREENING_ID));
    await confirmToCheckout(page);
    await payAndConfirm(page);

    await expect(page.getByTestId(testIds.confirmationHeading)).toHaveText(TEXTS.confirmationHeading);
    await expect(page.getByTestId(testIds.confirmationMessage)).toHaveText(
      TEXTS.confirmationMessage(VALID_CUSTOMER.email),
    );
    await page.reload();
    await expect(page.getByTestId(testIds.confirmationHeading)).toHaveText(TEXTS.confirmationHeading);

    // Continue returns to the movie list and clears the booking.
    await page.getByTestId(testIds.confirmationContinueButton).click();
    await expect(page).toHaveURL(urlOf('/'));
    await expect(page.getByTestId(testIds.dayPicker)).toBeVisible();

    await page.goto(routes.summary(DEFAULT_SCREENING_ID));
    await expect(page).toHaveURL(urlOf('/'));
    await page.goto(routes.confirmation);
    await expect(page).toHaveURL(urlOf('/'));

    await page.goto(routes.seats(DEFAULT_SCREENING_ID));
    await expect(seat(page, 7, column)).toHaveAttribute('data-state', 'available');
  });

  test('AC-69: Every confirmation identifier in section 9.5 is present with the exact names and values given there', async ({
    page,
  }) => {
    await openCheckout(page);
    await payAndConfirm(page);
    await expectPresent(page, [
      testIds.confirmationHeading,
      testIds.confirmationMessage,
      testIds.confirmationContinueButton,
    ]);
  });
});
