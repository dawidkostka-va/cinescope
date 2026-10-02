import type { Page } from '@playwright/test';
import { mockReservation } from '../../utils/network.js';
import { routes, testIds, urlOf } from '../../utils/selectors.js';
import { expect } from '../../utils/test.js';
import { fillCustomerForm, payButton } from '../checkout/checkout.utils.js';

/** From an open checkout: fill the form validly, pay against a mocked backend, land on /confirmation. */
export async function payAndConfirm(page: Page): Promise<void> {
  await mockReservation(page, 201);
  await fillCustomerForm(page);
  await payButton(page).click();
  await expect(page).toHaveURL(urlOf(routes.confirmation));
  await expect(page.getByTestId(testIds.confirmationHeading)).toBeVisible();
}
