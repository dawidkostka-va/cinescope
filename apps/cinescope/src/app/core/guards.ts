import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const inProgressBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const id = Number(route.paramMap.get('id'));
  const ok = !!booking && !booking.paid && booking.screeningId === id && booking.items.length > 0;
  return ok || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () =>
  inject(BookingService).booking()?.paid === true || inject(Router).createUrlTree(['/']);
