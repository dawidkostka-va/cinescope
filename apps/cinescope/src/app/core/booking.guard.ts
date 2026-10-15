import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

/** Allows routes 3 and 4 only when the booking in progress belongs to this screening and has seats. */
export const bookingInProgressGuard: CanActivateFn = (route) => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));

  if (bookingService.isValidFor(id)) return true;
  return router.parseUrl('/');
};

/** Allows the confirmation route only once the booking has been paid. */
export const paidBookingGuard: CanActivateFn = () => {
  const bookingService = inject(BookingService);
  const router = inject(Router);

  if (bookingService.isPaid()) return true;
  return router.parseUrl('/');
};
