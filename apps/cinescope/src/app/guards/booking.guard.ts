import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from '../services/booking.service';

export const activeBookingGuard: CanActivateFn = (route) => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const screeningId = Number(route.paramMap.get('id'));
  if (bookingService.hasActiveBookingFor(screeningId)) {
    return true;
  }
  return router.parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  if (bookingService.hasPaidBooking()) {
    return true;
  }
  return router.parseUrl('/');
};
