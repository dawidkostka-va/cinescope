import type { Page } from '@playwright/test';
import { VALID_CUSTOMER } from '../../mocks/customer.js';
import type { CustomerForm } from '../../types/index.js';
import { nativeCheckbox, nativeInput } from '../../utils/form-fields.js';
import { testIds } from '../../utils/selectors.js';
import { freeSeat } from '../seats/seats.utils.js';
import { bookSeats, confirmToCheckout, type Selection } from '../summary/summary.utils.js';

export const TEXT_FIELDS = {
  firstName: testIds.firstNameInput,
  lastName: testIds.lastNameInput,
  email: testIds.emailInput,
  confirmEmail: testIds.confirmEmailInput,
  phone: testIds.phoneInput,
} as const;

/** Seat map → summary → checkout with one row-7 seat unless told otherwise. */
export async function openCheckout(
  page: Page,
  selection: Selection = { seats: [{ row: 7, column: freeSeat(7) }] },
): Promise<void> {
  await bookSeats(page, selection);
  await confirmToCheckout(page);
}

export async function fillCustomerForm(page: Page, customer: Partial<CustomerForm> = {}): Promise<void> {
  const data = { ...VALID_CUSTOMER, ...customer };
  for (const [key, testId] of Object.entries(TEXT_FIELDS) as [keyof typeof TEXT_FIELDS, string][]) {
    await nativeInput(page, testId).fill(data[key]);
  }
  const terms = nativeCheckbox(page, testIds.termsCheckbox);
  if (data.terms) await terms.check();
  else await terms.uncheck();
}

export function payButton(page: Page) {
  return page.getByTestId(testIds.payButton);
}
