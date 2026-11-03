import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const inProgressBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const ok =
    !!booking && !booking.paid && booking.screeningId === Number(route.paramMap.get('id')) && booking.seats.length > 0;
  return ok || inject(Router).parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  return !!inject(BookingService).booking()?.paid || inject(Router).parseUrl('/');
};
