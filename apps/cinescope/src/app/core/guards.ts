import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Booking } from './booking';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const id = Number(route.paramMap.get('id'));
  return inject(Booking).canCheckout(id) || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => inject(Booking).isPaid() || inject(Router).createUrlTree(['/']);
