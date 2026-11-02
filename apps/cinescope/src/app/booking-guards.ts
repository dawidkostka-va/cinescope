import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { readBooking } from './booking';

export const bookingInProgress: CanActivateFn = (route) => {
  const booking = readBooking();
  const screeningId = Number(route.paramMap.get('id'));
  if (booking && booking.screeningId === screeningId && booking.paidEmail === null && booking.itemIds.length > 0) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};

export const bookingPaid: CanActivateFn = () => {
  const booking = readBooking();
  if (booking?.paidEmail) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};
