export interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export interface Booking {
  screeningId: number;
  itemIds: string[];
  customer: CustomerForm;
  paidEmail: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

export function newBooking(screeningId: number): Booking {
  return {
    screeningId,
    itemIds: [],
    customer: { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false },
    paidEmail: null,
  };
}

export function readBooking(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw === null ? null : (JSON.parse(raw) as Booking);
}

export function writeBooking(booking: Booking): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

export function clearBooking(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
