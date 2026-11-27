import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));
  const current = booking.booking();
  const allowed = booking.matchesScreening(id) && current.seats.length > 0;
  return allowed || router.createUrlTree(['/']);
};

export const paidGuard: CanActivateFn = () => {
  const booking = inject(BookingService);
  const router = inject(Router);
  return booking.booking().paid || router.createUrlTree(['/']);
};
