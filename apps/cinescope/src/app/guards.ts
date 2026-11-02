import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const router = inject(Router);
  const b = booking.booking();
  const ok = !!b && !b.paid && String(b.screeningId) === route.paramMap.get('id') && b.seats.length > 0;
  return ok || router.createUrlTree(['/']);
};

export const paidGuard: CanActivateFn = () => {
  const booking = inject(BookingService);
  const router = inject(Router);
  return !!booking.booking()?.paid || router.createUrlTree(['/']);
};
