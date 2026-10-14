import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from '../services/booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const bookingService = inject(BookingService);
  const router = inject(Router);

  const screeningId = Number(route.paramMap.get('id'));
  if (bookingService.isInProgressFor(screeningId)) {
    return true;
  }
  return router.parseUrl('/');
};
