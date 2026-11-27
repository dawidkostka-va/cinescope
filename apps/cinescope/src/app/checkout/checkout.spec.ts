import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import type { MockInstance } from 'vitest';
import { BookedSeat, BookingService, CheckoutValues } from '../booking';
import { ToastService } from '../toast';
import { Checkout } from './checkout';

const API = 'http://localhost:3000';

const seat = (row: number, column: number): BookedSeat => ({ kind: 'seat', row, column, columnEnd: column });
const couch = (row: number, column: number): BookedSeat => ({ kind: 'couch', row, column, columnEnd: column + 1 });

describe('Checkout', () => {
  let fixture: ComponentFixture<Checkout>;
  let http: HttpTestingController;
  let navigate: MockInstance<Router['navigate']>;
  let toast: MockInstance<ToastService['show']>;

  const el = (testId: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
  const text = (testId: string): string | undefined => el(testId)?.textContent?.trim();
  const input = (testId: string): HTMLInputElement => el(testId) as HTMLInputElement;

  const type = (testId: string, value: string) => {
    input(testId).value = value;
    input(testId).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const blur = (testId: string) => {
    el(testId)?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };
  const click = (testId: string) => {
    el(testId)?.click();
    fixture.detectChanges();
  };
  const toggleTerms = () => {
    (el('terms-checkbox')?.querySelector('input') as HTMLInputElement).click();
    fixture.detectChanges();
  };

  /** Fills every field with a valid value, phone included. */
  const fillValid = () => {
    type('first-name-input', 'Anna');
    type('last-name-input', 'Kowalska');
    type('email-input', 'anna.kowalska@example.com');
    type('confirm-email-input', 'anna.kowalska@example.com');
    type('phone-input', '123456789');
    toggleTerms();
  };

  /** Stores the booking, then opens the checkout. */
  function openCheckout(seats: BookedSeat[], checkout?: CheckoutValues): void {
    TestBed.inject(BookingService).save({ screeningId: 1, seats, checkout });
    fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    toast = vi.spyOn(TestBed.inject(ToastService), 'show').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('shows the title, the labels with asterisks on the required fields and the total', () => {
    openCheckout([seat(2, 6), couch(15, 3)]);

    expect(text('checkout-title')).toBe('Your details');
    expect(text('first-name-label')).toBe('First name *');
    expect(text('last-name-label')).toBe('Last name *');
    expect(text('email-label')).toBe('Email *');
    expect(text('confirm-email-label')).toBe('Confirm email *');
    expect(text('phone-label')).toBe('Phone number');
    expect(text('terms-label')).toBe('I accept the terms and conditions *');
    expect(text('pay-button')).toBe('Pay 114.00 PLN');
  });

  it('shows a message only once the field has been left, and updates it as the value changes', () => {
    openCheckout([seat(2, 6)]);

    type('first-name-input', 'A');
    expect(el('first-name-error')).toBeNull();

    blur('first-name-input');
    expect(text('first-name-error')).toBe('First name must be at least 2 characters');

    type('first-name-input', 'Anna');
    expect(el('first-name-error')).toBeNull();
  });

  it('re-checks the confirm email when the email changes', () => {
    openCheckout([seat(2, 6)]);

    type('confirm-email-input', 'a@b.com');
    blur('confirm-email-input');
    expect(text('confirm-email-error')).toBe('Email addresses do not match');

    type('email-input', 'a@b.com');
    expect(el('confirm-email-error')).toBeNull();
  });

  it('marks every field and sends nothing when the form is invalid', () => {
    openCheckout([seat(2, 6)]);

    click('pay-button');

    expect(text('first-name-error')).toBe('First name is required');
    expect(text('last-name-error')).toBe('Last name is required');
    expect(text('email-error')).toBe('Email is required');
    expect(text('confirm-email-error')).toBe('Confirm email is required');
    expect(text('terms-error')).toBe('You must accept the terms and conditions');
    expect(el('phone-error')).toBeNull();
    expect(toast).toHaveBeenCalledWith('The form contains errors');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends the reservation of a valid form, disables the pay button in flight and opens the confirmation', async () => {
    openCheckout([couch(15, 3), seat(2, 6)]);
    fillValid();

    click('pay-button');

    expect((el('pay-button') as HTMLButtonElement).disabled).toBe(true);
    expect(text('pay-button')).toBe('Processing…');

    const request = http.expectOne(`${API}/reservations`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      screeningId: 1,
      seats: ['R2C6', 'R15C3', 'R15C4'],
      customer: {
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna.kowalska@example.com',
        phone: '123456789',
      },
      totalPrice: 114,
    });
    request.flush({ id: 7, screeningId: 1, seats: [], customer: {}, totalPrice: 114 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(BookingService).current()?.paidEmail).toBe('anna.kowalska@example.com');
    expect(navigate).toHaveBeenCalledWith(['/confirmation']);
  });

  it('keeps the form and shows a toast when the reservation fails', async () => {
    openCheckout([seat(2, 6)]);
    fillValid();

    click('pay-button');
    http
      .expectOne(`${API}/reservations`)
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(toast).toHaveBeenCalledWith('Payment failed. Please try again.');
    expect(navigate).not.toHaveBeenCalled();
    expect((el('pay-button') as HTMLButtonElement).disabled).toBe(false);
    expect(text('pay-button')).toBe('Pay 25.00 PLN');
    expect(input('first-name-input').value).toBe('Anna');
    expect(TestBed.inject(BookingService).current()?.paidEmail).toBeUndefined();
  });

  it('saves the values as they are typed and restores them in a new screen, without messages', () => {
    openCheckout([seat(2, 6)]);
    type('first-name-input', 'Anna');
    type('email-input', 'not-an-email');
    expect(TestBed.inject(BookingService).current()?.checkout?.firstName).toBe('Anna');

    openCheckout([seat(2, 6)], TestBed.inject(BookingService).current()?.checkout);

    expect(input('first-name-input').value).toBe('Anna');
    expect(input('email-input').value).toBe('not-an-email');
    expect(fixture.nativeElement.querySelectorAll('.field-error')).toHaveLength(0);
  });

  it('Back opens the summary', () => {
    openCheckout([seat(2, 6)]);

    click('checkout-back-button');

    expect(navigate).toHaveBeenCalledWith(['/screenings', 1, 'summary']);
  });
});
