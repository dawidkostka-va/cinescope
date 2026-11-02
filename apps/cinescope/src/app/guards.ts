import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const b = inject(BookingService).booking();
  const router = inject(Router);
  const ok = !!b && !b.paid && b.screeningId === Number(route.paramMap.get('id')) && b.seats.length > 0;
  return ok || router.createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const b = inject(BookingService).booking();
  return (!!b && b.paid) || inject(Router).createUrlTree(['/']);
};
