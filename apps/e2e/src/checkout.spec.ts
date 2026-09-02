import { test } from '@playwright/test';

test.describe('Checkout', () => {
  test.fixme('AC-41: The form renders first name, last name, email, confirm email, phone number and a terms checkbox', () => {
    // assertions written in the next step
  });

  test.fixme('AC-42: First name and last name are required and must be at least 2 characters', () => {
    // assertions written in the next step
  });

  test.fixme('AC-43: Email is required and must be a valid address; confirm email must match it', () => {
    // assertions written in the next step
  });

  test.fixme('AC-44: Phone number is optional; when filled it must be exactly 9 digits', () => {
    // assertions written in the next step
  });

  test.fixme('AC-45: The terms checkbox is required', () => {
    // assertions written in the next step
  });

  test.fixme('AC-46: Pay is enabled at all times; clicking it on an invalid form marks all fields as touched, shows the messages and shows the toast The form contains errors, without navigating', () => {
    // assertions written in the next step
  });

  test.fixme('AC-47: Pay on a valid form sends POST /reservations, shows a loading state, navigates to /confirmation on success, and on failure stays on the form and shows the toast Payment failed. Please try again', () => {
    // assertions written in the next step
  });
});
