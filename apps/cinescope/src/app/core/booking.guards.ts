import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const screeningId = Number(route.paramMap.get('id'));
  const allowed =
    booking !== null && booking.paidEmail === null && booking.screeningId === screeningId && booking.seats.length > 0;
  return allowed || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  return (booking?.paidEmail ?? null) !== null || inject(Router).createUrlTree(['/']);
};
