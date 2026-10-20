const STORAGE_KEY = 'cinescope.booking';

export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  acceptTerms: boolean;
}

export interface Booking {
  screeningId: number;
  seats: string[];
  checkout: CheckoutValues;
  paid: boolean;
  customerEmail: string | null;
}

export function emptyCheckout(): CheckoutValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    acceptTerms: false,
  };
}

export function emptyBooking(screeningId: number): Booking {
  return {
    screeningId,
    seats: [],
    checkout: emptyCheckout(),
    paid: false,
    customerEmail: null,
  };
}

function isBooking(value: unknown): value is Booking {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.screeningId === 'number' &&
    Array.isArray(candidate.seats) &&
    typeof candidate.paid === 'boolean' &&
    typeof candidate.checkout === 'object' &&
    candidate.checkout !== null
  );
}

export function loadBooking(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isBooking(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBooking(booking: Booking): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

export function clearBooking(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
