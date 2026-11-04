import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const router = inject(Router);
  return booking.inProgress(Number(route.paramMap.get('id'))) || router.createUrlTree(['/']);
};
