import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingStore } from './booking';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const store = inject(BookingStore);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));
  const booking = store.booking();
  const ok = !!booking && booking.paidEmail === null && booking.screeningId === id && booking.seats.length > 0;
  return ok || router.createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const store = inject(BookingStore);
  return store.isPaid() || inject(Router).createUrlTree(['/']);
};
