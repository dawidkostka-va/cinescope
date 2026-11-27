import { Injectable, computed, signal } from '@angular/core';
import { SeatItem, compareItems, itemPrice, sameItem } from './seats/seat-layout';

export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

interface BookingState {
  screeningId: number | null;
  items: SeatItem[];
  form: CheckoutValues;
  paid: boolean;
  email: string;
}

const STORAGE_KEY = 'cinescope.booking';

export const emptyForm = (): CheckoutValues => ({
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
});

const emptyState = (): BookingState => ({
  screeningId: null,
  items: [],
  form: emptyForm(),
  paid: false,
  email: '',
});

function load(): BookingState {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      return {
        screeningId: typeof raw.screeningId === 'number' ? raw.screeningId : null,
        items: Array.isArray(raw.items) ? raw.items : [],
        form: { ...emptyForm(), ...raw.form },
        paid: raw.paid === true,
        email: typeof raw.email === 'string' ? raw.email : '',
      };
    }
  } catch {
    // unreadable storage: start with an empty booking
  }
  return emptyState();
}

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly state = signal<BookingState>(load());

  readonly screeningId = computed(() => this.state().screeningId);
  readonly paid = computed(() => this.state().paid);
  readonly email = computed(() => this.state().email);
  readonly form = computed(() => this.state().form);
  readonly items = computed(() => [...this.state().items].sort(compareItems));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + itemPrice(item), 0));

  startNew(screeningId: number): void {
    this.update({ ...emptyState(), screeningId });
  }

  clear(): void {
    this.update(emptyState());
  }

  toggle(item: SeatItem): void {
    const items = this.state().items;
    this.update({
      ...this.state(),
      items: items.some((i) => sameItem(i, item))
        ? items.filter((i) => !sameItem(i, item))
        : [...items, item],
    });
  }

  remove(item: SeatItem): void {
    this.update({
      ...this.state(),
      items: this.state().items.filter((i) => !sameItem(i, item)),
    });
  }

  setForm(form: CheckoutValues): void {
    this.update({ ...this.state(), form: { ...form } });
  }

  markPaid(email: string): void {
    this.update({ ...this.state(), paid: true, email });
  }

  /** True when an unpaid booking with seats exists for this screening. */
  hasOpenBookingFor(screeningId: number): boolean {
    const state = this.state();
    return !state.paid && state.screeningId === screeningId && state.items.length > 0;
  }

  private update(state: BookingState): void {
    this.state.set(state);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable: the in-memory booking still works
    }
  }
}
