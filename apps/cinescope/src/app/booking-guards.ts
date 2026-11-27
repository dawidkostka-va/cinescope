import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingStore } from './booking';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingStore);
  const id = Number(route.paramMap.get('id'));
  return booking.hasOpenBookingFor(id) || inject(Router).parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () =>
  inject(BookingStore).paid() || inject(Router).parseUrl('/');
