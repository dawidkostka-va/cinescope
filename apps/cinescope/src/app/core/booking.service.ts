import { Injectable, computed, inject, signal } from '@angular/core';
import { Cell, cellIds } from './auditorium';
import { CheckoutValues, EMPTY_CHECKOUT } from './checkout';
import { priceOf } from './pricing';
import { ToastService } from './toast.service';

export const MAX_SEATS = 10;
const STORAGE_KEY = 'cinescope.booking';

interface Booking {
  screeningId: number;
  seats: Cell[];
  form: CheckoutValues;
  paidEmail?: string;
}

function sameCell(a: Cell, b: Cell): boolean {
  return cellIds(a).join() === cellIds(b).join();
}

export function seatCountOf(cell: Cell): number {
  return cell.kind === 'couch' ? 2 : 1;
}

function readBooking(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly toasts = inject(ToastService);
  private readonly booking = signal<Booking | null>(readBooking());

  readonly screeningId = computed(() => this.booking()?.screeningId ?? null);
  readonly seats = computed(() => this.booking()?.seats ?? []);
  readonly form = computed(() => this.booking()?.form ?? EMPTY_CHECKOUT);
  readonly paidEmail = computed(() => this.booking()?.paidEmail ?? null);
  readonly seatCount = computed(() => this.seats().reduce((total, cell) => total + seatCountOf(cell), 0));
  readonly total = computed(() => this.seats().reduce((sum, cell) => sum + priceOf(cell), 0));

  begin(screeningId: number): void {
    if (this.screeningId() !== screeningId || this.paidEmail() !== null) {
      this.store({ screeningId, seats: [], form: EMPTY_CHECKOUT });
    }
  }

  isSelected(cell: Cell): boolean {
    return this.seats().some((selected) => sameCell(selected, cell));
  }

  toggle(cell: Cell): void {
    if (this.isSelected(cell)) {
      this.writeSeats(this.seats().filter((selected) => !sameCell(selected, cell)));
      return;
    }
    if (this.seatCount() + seatCountOf(cell) > MAX_SEATS) {
      this.toasts.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    }
    this.writeSeats([...this.seats(), cell]);
  }

  updateForm(form: CheckoutValues): void {
    const booking = this.booking();
    if (booking) {
      this.store({ ...booking, form });
    }
  }

  markPaid(email: string): void {
    const booking = this.booking();
    if (booking) {
      this.store({ ...booking, paidEmail: email });
    }
  }

  clear(): void {
    this.store(null);
  }

  private writeSeats(seats: Cell[]): void {
    const booking = this.booking();
    if (booking) {
      this.store({ ...booking, seats });
    }
  }

  private store(booking: Booking | null): void {
    this.booking.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}
