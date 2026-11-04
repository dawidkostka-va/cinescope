import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));
  return booking.isReadyFor(id) ? true : router.createUrlTree(['/']);
};

export const paidGuard: CanActivateFn = () => {
  return inject(BookingService).isPaid() ? true : inject(Router).createUrlTree(['/']);
};
