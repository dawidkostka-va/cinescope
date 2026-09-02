import { expect, test, type Page } from '@playwright/test';
import { TOASTS } from './support/auditorium.js';
import { DEFAULT_SCREENING_ID } from './support/fixture.js';
import {
  bookSeats,
  confirmToCheckout,
  fillCustomerForm,
  freeSeat,
  mockReservation,
  toast,
  VALID_CUSTOMER,
} from './support/flows.js';
import { routes, testIds } from './support/selectors.js';

async function openCheckout(page: Page): Promise<void> {
  await bookSeats(page, [{ row: 7, column: freeSeat(7) }]);
  await confirmToCheckout(page);
}

test.beforeEach(async ({ page }) => {
  await openCheckout(page);
});

test.describe('Checkout', () => {
  test('AC-41: The form renders first name, last name, email, confirm email, phone number and a terms checkbox', async ({
    page,
  }) => {
    for (const id of [
      testIds.firstNameInput,
      testIds.lastNameInput,
      testIds.emailInput,
      testIds.confirmEmailInput,
      testIds.phoneInput,
      testIds.termsCheckbox,
    ]) {
      await expect(page.getByTestId(id), id).toBeVisible();
    }
  });

  test('AC-42: First name and last name are required and must be at least 2 characters', async ({
    page,
  }) => {
    await page.getByTestId(testIds.firstNameInput).click();
    await page.getByTestId(testIds.lastNameInput).click();
    await page.getByTestId(testIds.emailInput).click();
    await expect(page.getByTestId(testIds.firstNameError)).toBeVisible();
    await expect(page.getByTestId(testIds.lastNameError)).toBeVisible();

    await page.getByTestId(testIds.firstNameInput).fill('A');
    await page.getByTestId(testIds.lastNameInput).fill('B');
    await page.getByTestId(testIds.emailInput).click();
    await expect(page.getByTestId(testIds.firstNameError)).toBeVisible();
    await expect(page.getByTestId(testIds.lastNameError)).toBeVisible();

    await page.getByTestId(testIds.firstNameInput).fill(VALID_CUSTOMER.firstName);
    await page.getByTestId(testIds.lastNameInput).fill(VALID_CUSTOMER.lastName);
    await page.getByTestId(testIds.emailInput).click();
    await expect(page.getByTestId(testIds.firstNameError)).toBeHidden();
    await expect(page.getByTestId(testIds.lastNameError)).toBeHidden();
  });

  test('AC-43: Email is required and must be a valid address; confirm email must match it', async ({
    page,
  }) => {
    await page.getByTestId(testIds.emailInput).fill('not-an-email');
    await page.getByTestId(testIds.confirmEmailInput).click();
    await expect(page.getByTestId(testIds.emailError)).toBeVisible();

    await page.getByTestId(testIds.emailInput).fill(VALID_CUSTOMER.email);
    await page.getByTestId(testIds.confirmEmailInput).fill('other@example.com');
    await page.getByTestId(testIds.emailInput).click();
    await expect(page.getByTestId(testIds.confirmEmailError)).toBeVisible();

    await page.getByTestId(testIds.confirmEmailInput).fill(VALID_CUSTOMER.email);
    await page.getByTestId(testIds.emailInput).click();
    await expect(page.getByTestId(testIds.confirmEmailError)).toBeHidden();
  });

  test('AC-44: Phone number is optional; when filled it must be exactly 9 digits', async ({
    page,
  }) => {
    await page.getByTestId(testIds.phoneInput).click();
    await page.getByTestId(testIds.emailInput).click();
    await expect(page.getByTestId(testIds.phoneError)).toBeHidden();

    await page.getByTestId(testIds.phoneInput).fill('12345');
    await page.getByTestId(testIds.emailInput).click();
    await expect(page.getByTestId(testIds.phoneError)).toBeVisible();

    await page.getByTestId(testIds.phoneInput).fill(VALID_CUSTOMER.phone);
    await page.getByTestId(testIds.emailInput).click();
    await expect(page.getByTestId(testIds.phoneError)).toBeHidden();
  });

  test('AC-45: The terms checkbox is required', async ({ page }) => {
    await fillCustomerForm(page, { terms: false });
    await page.getByTestId(testIds.payButton).click();
    await expect(page.getByTestId(testIds.termsError)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${routes.checkout(DEFAULT_SCREENING_ID)}$`));

    await page.getByTestId(testIds.termsCheckbox).check();
    await expect(page.getByTestId(testIds.termsError)).toBeHidden();
  });

  test('AC-46: Pay is enabled at all times; clicking it on an invalid form marks all fields as touched, shows the messages and shows the toast The form contains errors, without navigating', async ({
    page,
  }) => {
    await expect(page.getByTestId(testIds.payButton)).toBeEnabled();
    await page.getByTestId(testIds.payButton).click();

    await expect(toast(page)).toContainText(TOASTS.invalidForm);
    for (const id of [
      testIds.firstNameError,
      testIds.lastNameError,
      testIds.emailError,
      testIds.confirmEmailError,
      testIds.termsError,
    ]) {
      await expect(page.getByTestId(id), id).toBeVisible();
    }
    await expect(page).toHaveURL(new RegExp(`${routes.checkout(DEFAULT_SCREENING_ID)}$`));
  });

  test('AC-47: Pay on a valid form sends POST /reservations, shows a loading state, navigates to /confirmation on success, and on failure stays on the form and shows the toast Payment failed. Please try again', async ({
    page,
  }) => {
    // The visual loading state has no test id in the contract, so it is judged by hand
    // during the manual pass; what is machine-checkable is the request and the routing.
    await mockReservation(page, 500);
    await fillCustomerForm(page);

    const failed = page.waitForRequest(
      (request) => request.url().includes('/reservations') && request.method() === 'POST',
    );
    await page.getByTestId(testIds.payButton).click();
    await failed;

    await expect(toast(page)).toContainText(TOASTS.paymentFailed);
    await expect(page).toHaveURL(new RegExp(`${routes.checkout(DEFAULT_SCREENING_ID)}$`));

    await page.unroute('**/reservations');
    await mockReservation(page, 201);
    await page.getByTestId(testIds.payButton).click();
    await expect(page).toHaveURL(new RegExp(`${routes.confirmation}$`));
  });
});
