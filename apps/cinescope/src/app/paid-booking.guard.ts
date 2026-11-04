import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService);
  const router = inject(Router);
  return booking.paidEmail() !== null || router.createUrlTree(['/']);
};
