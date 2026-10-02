/** Every user-facing text the suite asserts on, verbatim from the specification. */
export const TEXTS = {
  seatLimitToast: 'Maximum 10 seats per booking',
  invalidFormToast: 'The form contains errors',
  paymentFailedToast: 'Payment failed. Please try again.',
  moviesFailed: 'Failed to load movies',
  moviesEmpty: 'No screenings on this day',
  seatMapTitle: 'Choose your seats',
  seatLimitInfo: 'You can reserve up to 10 seats per reservation',
  summaryTitle: 'Your tickets',
  checkoutTitle: 'Your details',
  confirmationHeading: 'Payment successful',
  confirmationMessage: (email: string) => `Your tickets will be sent shortly to ${email}`,
} as const;
