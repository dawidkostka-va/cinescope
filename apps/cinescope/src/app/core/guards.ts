import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const router = inject(Router);
  const screeningId = Number(route.paramMap.get('id'));
  return booking.hasUnpaidSeatsFor(screeningId) ? true : router.parseUrl('/');
};

export const confirmationGuard: CanActivateFn = () => {
  const booking = inject(BookingService);
  const router = inject(Router);
  return booking.hasPaidBooking() ? true : router.parseUrl('/');
};
