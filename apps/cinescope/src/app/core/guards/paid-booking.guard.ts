import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from '../services/booking.service';

export const paidBookingGuard: CanActivateFn = () => {
  const bookingService = inject(BookingService);
  const router = inject(Router);

  return bookingService.isPaid() || router.parseUrl('/');
};
