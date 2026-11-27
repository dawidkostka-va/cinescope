import { Injectable } from '@angular/core';

/** A seat (`start === end`) or a couch (`end === start + 1`) within one row. */
export interface SelectedUnit {
  row: number;
  start: number;
  end: number;
}

/** Values typed into the checkout form (section 7.1). */
export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

/** The booking in progress (section 3.1), kept in sessionStorage. */
export interface Booking {
  screeningId: number;
  units: SelectedUnit[];
  /** Checkout form values, saved as they are typed; absent until the form is used. */
  checkout?: CheckoutValues;
  /** Email address of the customer once the booking is paid. */
  paidEmail?: string;
}

const STORAGE_KEY = 'cinescope.booking';

export function unitKey(row: number, start: number): string {
  return `${row}:${start}`;
}

/** Seat identifiers `R<row>C<column>` of a unit; a couch gives both of its identifiers (section 2.1). */
export function seatIdentifiers(unit: SelectedUnit): string[] {
  const identifiers: string[] = [];
  for (let column = unit.start; column <= unit.end; column++) {
    identifiers.push(`R${unit.row}C${column}`);
  }
  return identifiers;
}

/** Orders units by row, then by column. */
export function sortUnits(units: readonly SelectedUnit[]): SelectedUnit[] {
  return [...units].sort((a, b) => a.row - b.row || a.start - b.start);
}

/** `Couch <a>-<b>` for a couch, the column number for a single seat (AC-37). */
export function describeSeat(unit: SelectedUnit): string {
  return unit.start === unit.end ? `${unit.start}` : `Couch ${unit.start}-${unit.end}`;
}

/** Reads and writes the booking in sessionStorage, so it survives a reload. */
@Injectable({ providedIn: 'root' })
export class BookingStore {
  read(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const booking = JSON.parse(raw) as Booking;
      return typeof booking?.screeningId === 'number' && Array.isArray(booking.units) ? booking : null;
    } catch {
      return null;
    }
  }

  write(booking: Booking): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }

  /** Merges `change` into the booking in progress, keeping the other fields; does nothing without one. */
  update(change: Partial<Booking>): void {
    const current = this.read();
    if (current) {
      this.write({ ...current, ...change });
    }
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
