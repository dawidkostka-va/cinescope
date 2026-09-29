import { formatPrice, PRICES } from '../../mocks/auditorium.js';
import { VALID_CUSTOMER } from '../../mocks/customer.js';
import { DEFAULT_SCREENING_ID } from '../../mocks/fixture.js';
import { TEXTS } from '../../mocks/messages.js';
import { fillAndLeave, nativeCheckbox, nativeInput, renderedLabel, touch } from '../../utils/form-fields.js';
import { expectPresent } from '../../utils/identifiers.js';
import { gate, mockReservation, unmockReservation } from '../../utils/network.js';
import { routes, testIds, urlOf } from '../../utils/selectors.js';
import { expect, test } from '../../utils/test.js';
import { toast } from '../../utils/toast.js';
import { freeCouchStart, freeSeat, openSeatMap } from '../seats/seats.utils.js';
import { confirmToCheckout, summaryItems } from '../summary/summary.utils.js';
import { fillCustomerForm, openCheckout, payButton, TEXT_FIELDS } from './checkout.utils.js';

const checkoutUrl = urlOf(routes.checkout(DEFAULT_SCREENING_ID));

test.describe('Checkout — /screenings/:id/checkout', () => {
  test.beforeEach(async ({ page }) => {
    await openCheckout(page);
  });

  test('AC-41: The form renders first name, last name, email, confirm email, phone number and a terms checkbox', async ({
    page,
  }) => {
    for (const id of Object.values(TEXT_FIELDS)) {
      await expect(nativeInput(page, id), id).toBeVisible();
    }
    await expect(nativeCheckbox(page, testIds.termsCheckbox)).toBeAttached();
    await expect(page.getByTestId(testIds.termsCheckbox).first()).toBeVisible();
  });

  test('AC-42: First name and last name are required and must be at least 2 characters', async ({
    page,
  }) => {
    await touch(page, testIds.firstNameInput);
    await touch(page, testIds.lastNameInput);
    await expect(page.getByTestId(testIds.firstNameError)).toBeVisible();
    await expect(page.getByTestId(testIds.lastNameError)).toBeVisible();

    await fillAndLeave(page, testIds.firstNameInput, 'A');
    await fillAndLeave(page, testIds.lastNameInput, 'B');
    await expect(page.getByTestId(testIds.firstNameError)).toBeVisible();
    await expect(page.getByTestId(testIds.lastNameError)).toBeVisible();

    await fillAndLeave(page, testIds.firstNameInput, VALID_CUSTOMER.firstName);
    await fillAndLeave(page, testIds.lastNameInput, VALID_CUSTOMER.lastName);
    await expect(page.getByTestId(testIds.firstNameError)).toHaveCount(0);
    await expect(page.getByTestId(testIds.lastNameError)).toHaveCount(0);
  });

  test('AC-43: Email is required and must be a valid address; confirm email must match it', async ({
    page,
  }) => {
    await fillAndLeave(page, testIds.emailInput, 'not-an-email');
    await expect(page.getByTestId(testIds.emailError)).toBeVisible();

    await fillAndLeave(page, testIds.emailInput, VALID_CUSTOMER.email);
    await expect(page.getByTestId(testIds.emailError)).toHaveCount(0);
    await fillAndLeave(page, testIds.confirmEmailInput, 'other@example.com');
    await expect(page.getByTestId(testIds.confirmEmailError)).toBeVisible();

    await fillAndLeave(page, testIds.confirmEmailInput, VALID_CUSTOMER.email);
    await expect(page.getByTestId(testIds.confirmEmailError)).toHaveCount(0);
  });

  test('AC-44: Phone number is optional; when filled it must be exactly 9 digits', async ({ page }) => {
    await touch(page, testIds.phoneInput);
    await expect(page.getByTestId(testIds.phoneError)).toHaveCount(0);

    await fillAndLeave(page, testIds.phoneInput, '12345');
    await expect(page.getByTestId(testIds.phoneError)).toBeVisible();

    await fillAndLeave(page, testIds.phoneInput, VALID_CUSTOMER.phone);
    await expect(page.getByTestId(testIds.phoneError)).toHaveCount(0);
  });

  test('AC-45: The terms checkbox is required', async ({ page }) => {
    await fillCustomerForm(page, { terms: false });
    await payButton(page).click();
    await expect(page.getByTestId(testIds.termsError)).toBeVisible();
    await expect(page).toHaveURL(checkoutUrl);

    await nativeCheckbox(page, testIds.termsCheckbox).check();
    await expect(page.getByTestId(testIds.termsError)).toHaveCount(0);
  });

  test('AC-46: The pay button is enabled whenever no payment request is in flight; clicking it on an invalid form marks all fields as touched, shows the messages and shows the toast The form contains errors, without navigating', async ({
    page,
  }) => {
    await expect(payButton(page)).toBeEnabled();
    await payButton(page).click();

    await expect(toast(page)).toContainText(TEXTS.invalidFormToast);
    for (const id of [
      testIds.firstNameError,
      testIds.lastNameError,
      testIds.emailError,
      testIds.confirmEmailError,
      testIds.termsError,
    ]) {
      await expect(page.getByTestId(id), id).toBeVisible();
    }
    await expect(page).toHaveURL(checkoutUrl);
    await expect(payButton(page)).toBeEnabled();
  });

  test('AC-47: The pay button on a valid form sends POST /reservations, is disabled while the request is in flight, navigates to /confirmation on success, and on failure stays on the form and shows the toast Payment failed. Please try again.', async ({
    page,
  }) => {
    const { held, release } = gate();
    await mockReservation(page, 500, held);
    await fillCustomerForm(page);

    const failed = page.waitForRequest(
      (request) => request.url().includes('/reservations') && request.method() === 'POST',
    );
    await payButton(page).click();
    await failed;
    await expect(payButton(page)).toBeDisabled();

    release();
    await expect(toast(page)).toContainText(TEXTS.paymentFailedToast);
    await expect(payButton(page)).toBeEnabled();
    await expect(page).toHaveURL(checkoutUrl);

    await unmockReservation(page);
    await mockReservation(page, 201);
    await payButton(page).click();
    await expect(page).toHaveURL(urlOf(routes.confirmation));
  });

  test('AC-61: The checkout shows the title Your details', async ({ page }) => {
    await expect(page.getByTestId(testIds.checkoutTitle)).toHaveText(TEXTS.checkoutTitle);
  });

  test('AC-62: The pay button reads Pay <total> PLN, the total of the booking', async ({ page }) => {
    await expect(payButton(page)).toHaveText(`Pay ${formatPrice(PRICES.middle)}`);

    await openCheckout(page, { seats: [{ row: 7, column: freeSeat(7, 1) }], couches: [freeCouchStart()] });
    // The first seat is still booked from beforeEach: two row-7 seats and a couch.
    await expect(payButton(page)).toHaveText(`Pay ${formatPrice(PRICES.middle * 2 + PRICES.couch)}`);
  });

  test('AC-63: Back on the checkout returns to the summary with the booking intact', async ({ page }) => {
    await page.getByTestId(testIds.checkoutBackButton).click();
    await expect(page).toHaveURL(urlOf(routes.summary(DEFAULT_SCREENING_ID)));
    await expect(summaryItems(page)).toHaveCount(1);
    await expect(page.getByTestId(testIds.summaryItemSeat)).toHaveText(String(freeSeat(7)));
  });

  test('AC-64: The checkout values survive going back to the summary and forward again, and a page reload; a new booking starts with an empty form', async ({
    page,
  }) => {
    await fillCustomerForm(page, { phone: '' });

    const expectRestored = async (when: string): Promise<void> => {
      await expect(nativeInput(page, testIds.firstNameInput), when).toHaveValue(VALID_CUSTOMER.firstName);
      await expect(nativeInput(page, testIds.lastNameInput), when).toHaveValue(VALID_CUSTOMER.lastName);
      await expect(nativeInput(page, testIds.emailInput), when).toHaveValue(VALID_CUSTOMER.email);
      await expect(nativeInput(page, testIds.confirmEmailInput), when).toHaveValue(VALID_CUSTOMER.confirmEmail);
      await expect(nativeInput(page, testIds.phoneInput), when).toHaveValue('');
      await expect(nativeCheckbox(page, testIds.termsCheckbox), when).toBeChecked();
    };

    await page.getByTestId(testIds.checkoutBackButton).click();
    await confirmToCheckout(page);
    await expectRestored('after Back and Confirm');

    await page.getByTestId(testIds.checkoutBackButton).click();
    await page.getByTestId(testIds.backButton).click();
    await page.getByTestId(testIds.continueButton).click();
    await confirmToCheckout(page);
    await expectRestored('after returning from the seat map');

    await page.reload();
    await expect(payButton(page)).toBeVisible();
    await expectRestored('after a reload');
    // Only the values are restored, not whether a field was left.
    await expect(page.getByTestId(testIds.firstNameError)).toHaveCount(0);

    // Cancel clears the booking; the next booking's form is empty.
    await openSeatMap(page);
    await page.getByTestId(testIds.cancelButton).click();
    await openCheckout(page);
    for (const id of Object.values(TEXT_FIELDS)) {
      await expect(nativeInput(page, id), id).toHaveValue('');
    }
    await expect(nativeCheckbox(page, testIds.termsCheckbox)).not.toBeChecked();
  });

  test('AC-65: The labels of the five required fields end with *; the phone label does not', async ({
    page,
  }) => {
    for (const id of [
      testIds.firstNameLabel,
      testIds.lastNameLabel,
      testIds.emailLabel,
      testIds.confirmEmailLabel,
      testIds.termsLabel,
    ]) {
      expect(await renderedLabel(page, id), id).toMatch(/\*$/);
    }
    expect(await renderedLabel(page, testIds.phoneLabel)).not.toContain('*');
  });

  test('AC-68: Every checkout identifier in section 9.4 is present with the exact names and values given there', async ({
    page,
  }) => {
    await expectPresent(page, [
      testIds.checkoutTitle,
      testIds.firstNameLabel,
      testIds.lastNameLabel,
      testIds.emailLabel,
      testIds.confirmEmailLabel,
      testIds.phoneLabel,
      testIds.termsLabel,
      testIds.checkoutBackButton,
      testIds.payButton,
    ]);
    for (const id of [...Object.values(TEXT_FIELDS)]) {
      await expect(nativeInput(page, id), id).toBeAttached();
    }
    await expect(nativeCheckbox(page, testIds.termsCheckbox)).toBeAttached();

    // The error hooks exist only while their message is shown.
    await payButton(page).click();
    await expectPresent(page, [
      testIds.firstNameError,
      testIds.lastNameError,
      testIds.emailError,
      testIds.confirmEmailError,
      testIds.termsError,
    ]);
    await fillAndLeave(page, testIds.phoneInput, '123');
    await expectPresent(page, [testIds.phoneError]);
  });
});
