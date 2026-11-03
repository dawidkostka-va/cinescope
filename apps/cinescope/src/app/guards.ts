import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const b = inject(BookingService).state();
  const id = Number(route.paramMap.get('id'));
  return b && !b.paid && b.screeningId === id && b.seats.length > 0 ? true : inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const b = inject(BookingService).state();
  return b?.paid ? true : inject(Router).createUrlTree(['/']);
};
