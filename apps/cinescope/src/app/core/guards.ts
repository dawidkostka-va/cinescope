import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const id = route.paramMap.get('id') ?? '';
  const allowed =
    /^\d+$/.test(id) && !!booking && !booking.paid && booking.screeningId === Number(id) && booking.seats.length > 0;
  return allowed || inject(Router).parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  return (!!booking && booking.paid) || inject(Router).parseUrl('/');
};
