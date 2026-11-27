import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking';

/**
 * Lets the customer enter the summary or the checkout of the booking in progress: the booking
 * must be unpaid, belong to the screening in the URL and hold at least one seat. Otherwise the
 * customer is redirected to `/`.
 */
export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).current();
  const screeningId = Number(route.paramMap.get('id'));
  const allowed =
    booking !== null &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0 &&
    booking.paidEmail === undefined;
  return allowed ? true : inject(Router).createUrlTree(['/']);
};

/** Lets the customer see the confirmation: the booking must be paid. Otherwise the customer is redirected to `/`. */
export const bookingPaidGuard: CanActivateFn = () => {
  const booking = inject(BookingService).current();
  return booking?.paidEmail !== undefined ? true : inject(Router).createUrlTree(['/']);
};
