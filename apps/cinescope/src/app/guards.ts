import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const inProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const id = Number(route.paramMap.get('id'));
  const ok = !!booking && !booking.paid && booking.screeningId === id && booking.seats.length > 0;
  return ok || inject(Router).parseUrl('/');
};

export const paidGuard: CanActivateFn = () => {
  const ok = !!inject(BookingService).booking()?.paid;
  return ok || inject(Router).parseUrl('/');
};
