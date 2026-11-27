import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingStore } from './booking';

/**
 * Lets a route for screening `:id` open only while the booking is unpaid, holds seats and belongs
 * to that screening (section 3.1). Otherwise redirects to the movie list. Runs on every entry,
 * including reloads.
 */
export const bookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingStore).read();
  const screeningId = Number(route.paramMap.get('id'));
  const allowed =
    booking !== null &&
    booking.screeningId === screeningId &&
    booking.units.length > 0 &&
    booking.paidEmail === undefined;
  return allowed ? true : inject(Router).createUrlTree(['/']);
};

/** Lets the confirmation open only once the booking is paid (section 3.1). Otherwise redirects to the movie list. */
export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingStore).read();
  return booking?.paidEmail !== undefined ? true : inject(Router).createUrlTree(['/']);
};
