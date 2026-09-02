import type { Locator, Page } from '@playwright/test';
import { type SeatState } from './auditorium.js';

/**
 * The suite addresses the application only through the `data-testid` contract frozen in the
 * task specification — never through text, CSS classes or DOM structure.
 */
export const routes = {
  movieList: '/',
  seats: (screeningId: number) => `/screenings/${String(screeningId)}/seats`,
  summary: (screeningId: number) => `/screenings/${String(screeningId)}/summary`,
  checkout: (screeningId: number) => `/screenings/${String(screeningId)}/checkout`,
  confirmation: '/confirmation',
} as const;

export function movieCard(page: Page, movieId: number): Locator {
  return page.locator(`[data-testid="movie-card"][data-movie-id="${String(movieId)}"]`);
}

export function screeningButton(page: Page, screeningId: number): Locator {
  return page.locator(`[data-testid="screening-button"][data-screening-id="${String(screeningId)}"]`);
}

export function seat(page: Page, row: number, column: number): Locator {
  return page.locator(
    `[data-testid="seat"][data-row="${String(row)}"][data-column="${String(column)}"]`,
  );
}

export function couch(page: Page, columnStart: number): Locator {
  return page.locator(
    `[data-testid="couch"][data-column-start="${String(columnStart)}"]`,
  );
}

export function seatsInState(page: Page, state: SeatState): Locator {
  return page.locator(`[data-testid="seat"][data-state="${state}"]`);
}

export function rowLocator(page: Page, row: number): Locator {
  return page.locator(`[data-testid="seat-row"][data-row="${String(row)}"]`);
}

export const testIds = {
  movieList: 'movie-list',
  moviesLoading: 'movies-loading',
  moviesError: 'movies-error',
  moviesRetryButton: 'movies-retry-button',
  movieTitle: 'movie-title',
  movieGenre: 'movie-genre',
  movieRuntime: 'movie-runtime',
  movieFormat: 'movie-format',
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
  toast: 'toast',
  cancelButton: 'cancel-button',
  continueButton: 'continue-button',
  summaryList: 'summary-list',
  summaryItem: 'summary-item',
  summaryItemTitle: 'summary-item-title',
  summaryItemDatetime: 'summary-item-datetime',
  summaryItemRow: 'summary-item-row',
  summaryItemSeat: 'summary-item-seat',
  summaryItemPrice: 'summary-item-price',
  summaryTotal: 'summary-total',
  backButton: 'back-button',
  confirmButton: 'confirm-button',
  firstNameInput: 'first-name-input',
  lastNameInput: 'last-name-input',
  emailInput: 'email-input',
  confirmEmailInput: 'confirm-email-input',
  phoneInput: 'phone-input',
  termsCheckbox: 'terms-checkbox',
  firstNameError: 'first-name-error',
  lastNameError: 'last-name-error',
  emailError: 'email-error',
  confirmEmailError: 'confirm-email-error',
  phoneError: 'phone-error',
  termsError: 'terms-error',
  payButton: 'pay-button',
  confirmationHeading: 'confirmation-heading',
  confirmationMessage: 'confirmation-message',
  confirmationContinueButton: 'confirmation-continue-button',
} as const;
