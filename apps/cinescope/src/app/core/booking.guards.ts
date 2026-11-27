import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const activeBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const router = inject(Router);
  const current = booking.booking();
  const allowed =
    !!current &&
    booking.isInProgressFor(route.paramMap.get('id') ?? '') &&
    current.seats.length > 0;
  return allowed || router.parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService);
  const router = inject(Router);
  return booking.booking()?.paid === true || router.parseUrl('/');
};
