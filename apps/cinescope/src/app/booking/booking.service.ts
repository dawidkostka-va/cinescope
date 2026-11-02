import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { CheckoutValues } from '../models';
import { Cell } from '../seat-map/auditorium';

export interface Booking {
  screeningId: number;
  cells: Cell[];
  form: CheckoutValues | null;
  paidEmail: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

function readBooking(): Booking | null {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(readBooking());

  readonly booking = this.state.asReadonly();
  readonly cells = computed(() => this.state()?.cells ?? []);

  startOrResume(screeningId: number): void {
    const current = this.state();
    if (current && current.paidEmail === null && current.screeningId === screeningId) return;
    this.write({ screeningId, cells: [], form: null, paidEmail: null });
  }

  setCells(cells: Cell[]): void {
    this.patch({ cells });
  }

  setForm(form: CheckoutValues): void {
    this.patch({ form });
  }

  markPaid(email: string): void {
    this.patch({ paidEmail: email });
  }

  clear(): void {
    this.write(null);
  }

  private patch(change: Partial<Booking>): void {
    const current = this.state();
    if (!current) return;
    this.write({ ...current, ...change });
  }

  private write(booking: Booking | null): void {
    this.state.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const unpaidBookingGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const booking = inject(BookingService).booking();
  const screeningId = Number(route.paramMap.get('id'));
  const valid = booking !== null && booking.paidEmail === null && booking.screeningId === screeningId && booking.cells.length > 0;
  return valid || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  return (booking !== null && booking.paidEmail !== null) || inject(Router).createUrlTree(['/']);
};
