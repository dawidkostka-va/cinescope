import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));
  const current = booking.booking();
  const ok = !!current && !current.paid && current.screeningId === id && current.seats.length > 0;
  return ok || router.parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService);
  const router = inject(Router);
  return booking.booking()?.paid === true || router.parseUrl('/');
};
