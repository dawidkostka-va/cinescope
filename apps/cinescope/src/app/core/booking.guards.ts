import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));
  return bookingService.isActiveFor(id) || router.parseUrl('/');
};

export const bookingPaidGuard: CanActivateFn = () => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  return bookingService.isPaid() || router.parseUrl('/');
};
