import type { Locator, Page } from '@playwright/test';

/**
 * The suite addresses the application only through the `data-testid` contract in section 9
 * of the specification — never through text, CSS classes or DOM structure.
 */
export const routes = {
  movieList: '/',
  movieListOn: (date: string) => `/?date=${date}`,
  seats: (screeningId: number) => `/screenings/${String(screeningId)}/seats`,
  summary: (screeningId: number) => `/screenings/${String(screeningId)}/summary`,
  checkout: (screeningId: number) => `/screenings/${String(screeningId)}/checkout`,
  confirmation: '/confirmation',
} as const;

/** A route as a URL matcher: exact path, any origin, any query string. */
export function urlOf(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https?://[^/]+${escaped}(\\?.*)?$`);
}

/** `[data-testid="seat"][data-row="7"]` from a test id and data attributes. */
export function byTestId(
  scope: Page | Locator,
  testId: string,
  attributes: Record<string, string | number | boolean> = {},
): Locator {
  const filters = Object.entries(attributes)
    .map(([name, value]) => `[data-${name}="${String(value)}"]`)
    .join('');
  return scope.locator(`[data-testid="${testId}"]${filters}`);
}

export const testIds = {
  // movie list
  dayPicker: 'day-picker',
  dayButton: 'day-button',
  datePicker: 'date-picker',
  movieList: 'movie-list',
  moviesLoading: 'movies-loading',
  moviesError: 'movies-error',
  moviesRetryButton: 'movies-retry-button',
  moviesEmpty: 'movies-empty',
  movieCard: 'movie-card',
  movieTitle: 'movie-title',
  movieGenre: 'movie-genre',
  movieRuntime: 'movie-runtime',
  movieFormat: 'movie-format',
  screeningButton: 'screening-button',
  // seat selection
  seatMapTitle: 'seat-map-title',
  seatMapSubtitle: 'seat-map-subtitle',
  seatLimitInfo: 'seat-limit-info',
  screenIndicator: 'screen-indicator',
  seatMap: 'seat-map',
  seatRow: 'seat-row',
  rowLabelLeft: 'row-label-left',
  rowLabelRight: 'row-label-right',
  aisle: 'aisle',
  seat: 'seat',
  couch: 'couch',
  legend: 'legend',
  legendItem: 'legend-item',
  selectedSeats: 'selected-seats',
  selectedSeatsCount: 'selected-seats-count',
  selectedSeatsRow: 'selected-seats-row',
  cancelButton: 'cancel-button',
  continueButton: 'continue-button',
  // summary
  summaryTitle: 'summary-title',
  summaryList: 'summary-list',
  summaryItem: 'summary-item',
  summaryItemTitle: 'summary-item-title',
  summaryItemDatetime: 'summary-item-datetime',
  summaryItemRow: 'summary-item-row',
  summaryItemSeat: 'summary-item-seat',
  summaryItemPrice: 'summary-item-price',
  summaryItemRemoveButton: 'summary-item-remove-button',
  summaryTotal: 'summary-total',
  backButton: 'back-button',
  confirmButton: 'confirm-button',
  // checkout
  checkoutTitle: 'checkout-title',
  firstNameInput: 'first-name-input',
  lastNameInput: 'last-name-input',
  emailInput: 'email-input',
  confirmEmailInput: 'confirm-email-input',
  phoneInput: 'phone-input',
  termsCheckbox: 'terms-checkbox',
  firstNameLabel: 'first-name-label',
  lastNameLabel: 'last-name-label',
  emailLabel: 'email-label',
  confirmEmailLabel: 'confirm-email-label',
  phoneLabel: 'phone-label',
  termsLabel: 'terms-label',
  firstNameError: 'first-name-error',
  lastNameError: 'last-name-error',
  emailError: 'email-error',
  confirmEmailError: 'confirm-email-error',
  phoneError: 'phone-error',
  termsError: 'terms-error',
  checkoutBackButton: 'checkout-back-button',
  payButton: 'pay-button',
  // confirmation
  confirmationHeading: 'confirmation-heading',
  confirmationMessage: 'confirmation-message',
  confirmationContinueButton: 'confirmation-continue-button',
  // any screen
  toast: 'toast',
} as const;
