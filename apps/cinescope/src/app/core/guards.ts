import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const inProgressBookingGuard: CanActivateFn = (route) => {
  const b = inject(BookingService).booking();
  const ok = !!b && !b.paid && String(b.screeningId) === route.paramMap.get('id') && b.seats.length > 0;
  return ok || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const b = inject(BookingService).booking();
  return !!b?.paid || inject(Router).createUrlTree(['/']);
};
