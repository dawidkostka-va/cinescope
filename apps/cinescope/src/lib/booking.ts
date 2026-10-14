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
  seats: string[];
  form: CheckoutForm;
  paid: boolean;
  email?: string;
}

const STORAGE_KEY = 'cinescope:booking';

export const emptyCheckoutForm: CheckoutForm = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

export function createBooking(screeningId: number): Booking {
  return { screeningId, seats: [], form: { ...emptyCheckoutForm }, paid: false };
}

export function loadBooking(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

export function saveBooking(booking: Booking): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

export function clearStoredBooking(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
