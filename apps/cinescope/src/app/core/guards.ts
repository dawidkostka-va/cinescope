import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

/** Allows routes 3 and 4 only when the booking is unpaid, matches this screening and has seats. */
export const bookingInProgressGuard: CanActivateFn = (route) => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const screeningId = Number(route.paramMap.get('id'));
  const booking = bookingService.snapshot();

  if (booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0) {
    return true;
  }
  router.navigateByUrl('/');
  return false;
};

/** Allows the confirmation route only when the booking has been paid. */
export const paidBookingGuard: CanActivateFn = () => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const booking = bookingService.snapshot();

  if (booking && booking.paid) {
    return true;
  }
  router.navigateByUrl('/');
  return false;
};
