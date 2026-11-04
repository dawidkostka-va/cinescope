import { computed, Injectable, signal } from '@angular/core';
import { seatId } from './seat-selection/auditorium';

export const MAX_SEATS = 10;

const STORAGE_KEY = 'cinescope.booking';

export interface SelectedUnit {
  row: number;
  column: number;
  couch: boolean;
}

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export interface Booking {
  screeningId: number;
  units: SelectedUnit[];
  form: CheckoutForm;
  paid?: { email: string };
}

const EMPTY_FORM: CheckoutForm = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

export function unitSize(unit: SelectedUnit): number {
  return unit.couch ? 2 : 1;
}

export function unitSeatIds(unit: SelectedUnit): string[] {
  const ids = [seatId(unit.row, unit.column)];
  return unit.couch ? [...ids, seatId(unit.row, unit.column + 1)] : ids;
}

export function sortedUnits(units: SelectedUnit[]): SelectedUnit[] {
  return [...units].sort((a, b) => a.row - b.row || a.column - b.column);
}

function readStoredBooking(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(readStoredBooking());

  readonly units = computed(() => this.state()?.units ?? []);
  readonly form = computed(() => this.state()?.form ?? EMPTY_FORM);
  readonly paidEmail = computed(() => this.state()?.paid?.email ?? null);
  readonly seatCount = computed(() =>
    this.units().reduce((total, unit) => total + unitSize(unit), 0),
  );
  readonly selectedSeatIds = computed(() => new Set(this.units().flatMap(unitSeatIds)));

  open(screeningId: number): void {
    const booking = this.state();
    if (booking === null || booking.screeningId !== screeningId || booking.paid) {
      this.save({ screeningId, units: [], form: EMPTY_FORM });
    }
  }

  inProgress(screeningId: number): boolean {
    const booking = this.state();
    return (
      booking !== null &&
      booking.screeningId === screeningId &&
      !booking.paid &&
      booking.units.length > 0
    );
  }

  isSelected(unit: SelectedUnit): boolean {
    return this.selectedSeatIds().has(seatId(unit.row, unit.column));
  }

  toggle(unit: SelectedUnit): 'added' | 'removed' | 'limit' {
    if (this.isSelected(unit)) {
      this.remove(unit);
      return 'removed';
    }
    if (this.seatCount() + unitSize(unit) > MAX_SEATS) {
      return 'limit';
    }
    this.setUnits([...this.units(), unit]);
    return 'added';
  }

  remove(unit: SelectedUnit): void {
    this.setUnits(this.units().filter((u) => !(u.row === unit.row && u.column === unit.column)));
  }

  updateForm<K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]): void {
    const booking = this.state();
    if (booking) {
      this.save({ ...booking, form: { ...booking.form, [field]: value } });
    }
  }

  markPaid(email: string): void {
    const booking = this.state();
    if (booking) {
      this.save({ ...booking, paid: { email } });
    }
  }

  clear(): void {
    this.save(null);
  }

  private setUnits(units: SelectedUnit[]): void {
    const booking = this.state();
    if (booking) {
      this.save({ ...booking, units });
    }
  }

  private save(booking: Booking | null): void {
    this.state.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}
