import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const id = Number(route.paramMap.get('id'));
  return inject(BookingService).isUnpaidFor(id) || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () =>
  inject(BookingService).isPaid() || inject(Router).createUrlTree(['/']);
