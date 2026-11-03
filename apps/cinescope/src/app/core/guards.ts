import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { parseId } from './api';
import { BookingStore } from './booking';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const store = inject(BookingStore);
  const id = parseId(route.paramMap.get('id'));
  const booking = store.current();
  const allowed = id !== null && !!booking && !booking.paid && booking.screeningId === id && booking.seats.length > 0;
  return allowed || inject(Router).parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  return inject(BookingStore).current()?.paid === true || inject(Router).parseUrl('/');
};
