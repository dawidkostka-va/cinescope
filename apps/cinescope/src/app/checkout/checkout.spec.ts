import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../api.service';
import { bookingGuard } from '../booking';
import { NewReservation, Reservation } from '../models';
import { ToastService } from '../toast/toast';
import { Checkout } from './checkout';

const BOOKING_KEY = 'cinescope.booking';

const VALID = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna.kowalska@example.com',
  confirmEmail: 'anna.kowalska@example.com',
  phone: '123456789',
};

@Component({ template: '' })
class Home {}

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class Host {}

function createApi(succeeds: boolean) {
  return {
    createReservation: vi.fn((reservation: NewReservation): Observable<Reservation> =>
      succeeds ? of({ id: 1, ...reservation }) : throwError(() => new Error('500')),
    ),
  };
}

/** A booking with seats 7/12, 15/5-6 (121.00 PLN) and optionally saved form values. */
function storeBooking(checkout?: Record<string, unknown>): void {
  sessionStorage.setItem(
    BOOKING_KEY,
    JSON.stringify({
      screeningId: 1,
      seats: ['R15C5', 'R15C6', 'R7C12'],
      ...(checkout ? { checkout } : {}),
    }),
  );
}

async function settle(fixture: ComponentFixture<Host>): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
}

function query(fixture: ComponentFixture<Host>, testId: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
    `[data-testid="${testId}"]`,
  );
}

function text(el: HTMLElement | null): string | undefined {
  return el?.textContent?.trim();
}

function type(fixture: ComponentFixture<Host>, testId: string, value: string): void {
  const input = query(fixture, testId) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function leave(fixture: ComponentFixture<Host>, testId: string): void {
  query(fixture, testId)?.dispatchEvent(new Event('blur'));
}

function fillValid(fixture: ComponentFixture<Host>): void {
  type(fixture, 'first-name-input', VALID.firstName);
  type(fixture, 'last-name-input', VALID.lastName);
  type(fixture, 'email-input', VALID.email);
  type(fixture, 'confirm-email-input', VALID.confirmEmail);
  type(fixture, 'phone-input', VALID.phone);
  (query(fixture, 'terms-checkbox')?.querySelector('input') as HTMLInputElement).click();
}

async function open(
  url: string,
  api: ReturnType<typeof createApi>,
): Promise<ComponentFixture<Host>> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', component: Home },
        { path: 'confirmation', component: Home },
        { path: 'screenings/:id/summary', component: Home, canActivate: [bookingGuard] },
        { path: 'screenings/:id/checkout', component: Checkout, canActivate: [bookingGuard] },
      ]),
      { provide: ApiService, useValue: api },
    ],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await TestBed.inject(Router).navigateByUrl(url);
  await settle(fixture);
  return fixture;
}

describe('Checkout', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows the title, the fields and the pay button with the booking total', async () => {
    storeBooking();
    const fixture = await open('/screenings/1/checkout', createApi(true));

    expect(text(query(fixture, 'checkout-title'))).toBe('Your details');
    expect(text(query(fixture, 'first-name-label'))).toBe('First name *');
    expect(text(query(fixture, 'last-name-label'))).toBe('Last name *');
    expect(text(query(fixture, 'email-label'))).toBe('Email *');
    expect(text(query(fixture, 'confirm-email-label'))).toBe('Confirm email *');
    expect(text(query(fixture, 'phone-label'))).toBe('Phone number');
    expect(text(query(fixture, 'terms-label'))).toBe('I accept the terms and conditions *');
    expect(query(fixture, 'confirm-email-input')).not.toBeNull();
    expect(text(query(fixture, 'pay-button'))).toBe('Pay 121.00 PLN');
  });

  it('shows a field message once the field has been left', async () => {
    storeBooking();
    const fixture = await open('/screenings/1/checkout', createApi(true));

    type(fixture, 'first-name-input', 'A');
    fixture.detectChanges();
    expect(query(fixture, 'first-name-error')).toBeNull();

    leave(fixture, 'first-name-input');
    await settle(fixture);
    expect(text(query(fixture, 'first-name-error'))).toBe(
      'First name must be at least 2 characters',
    );
  });

  it('Pay on an invalid form marks every field, shows the toast and sends nothing', async () => {
    storeBooking();
    const api = createApi(true);
    const fixture = await open('/screenings/1/checkout', api);
    const toast = vi
      .spyOn(TestBed.inject(ToastService), 'show')
      .mockImplementation(() => undefined);

    query(fixture, 'pay-button')?.click();
    await settle(fixture);

    expect(text(query(fixture, 'first-name-error'))).toBe('First name is required');
    expect(text(query(fixture, 'last-name-error'))).toBe('Last name is required');
    expect(text(query(fixture, 'email-error'))).toBe('Email is required');
    expect(text(query(fixture, 'confirm-email-error'))).toBe('Confirm email is required');
    expect(text(query(fixture, 'terms-error'))).toBe('You must accept the terms and conditions');
    expect(query(fixture, 'phone-error')).toBeNull();
    expect(toast).toHaveBeenCalledWith('The form contains errors');
    expect(api.createReservation).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/screenings/1/checkout');
  });

  it('checks the email rules and re-checks the confirmation when Email changes', async () => {
    storeBooking();
    const fixture = await open('/screenings/1/checkout', createApi(true));

    type(fixture, 'email-input', 'not-an-email');
    leave(fixture, 'email-input');
    type(fixture, 'confirm-email-input', 'a@example.com');
    leave(fixture, 'confirm-email-input');
    await settle(fixture);
    expect(text(query(fixture, 'email-error'))).toBe('Enter a valid email address');
    expect(text(query(fixture, 'confirm-email-error'))).toBe('Email addresses do not match');

    type(fixture, 'email-input', 'a@example.com');
    await settle(fixture);
    expect(text(query(fixture, 'email-error'))).toBeUndefined();
    expect(query(fixture, 'confirm-email-error')).toBeNull();
  });

  it('accepts an empty phone number and rejects one that is not exactly 9 digits', async () => {
    storeBooking();
    const fixture = await open('/screenings/1/checkout', createApi(true));

    type(fixture, 'phone-input', '12345');
    leave(fixture, 'phone-input');
    await settle(fixture);
    expect(text(query(fixture, 'phone-error'))).toBe('Phone number must be exactly 9 digits');

    type(fixture, 'phone-input', '');
    await settle(fixture);
    expect(query(fixture, 'phone-error')).toBeNull();
  });

  it('a valid form sends the reservation, marks the booking paid and opens the confirmation', async () => {
    storeBooking();
    const api = createApi(true);
    const fixture = await open('/screenings/1/checkout', api);

    fillValid(fixture);
    await settle(fixture);
    query(fixture, 'pay-button')?.click();
    await settle(fixture);

    expect(api.createReservation).toHaveBeenCalledWith({
      screeningId: 1,
      seats: ['R7C12', 'R15C5', 'R15C6'],
      customer: {
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna.kowalska@example.com',
        phone: '123456789',
      },
      totalPrice: 121,
    });
    expect(TestBed.inject(Router).url).toBe('/confirmation');
    expect(JSON.parse(sessionStorage.getItem(BOOKING_KEY) ?? 'null').paid).toEqual({
      email: 'anna.kowalska@example.com',
    });
  });

  it('disables the pay button while the reservation is in flight', async () => {
    storeBooking();
    const api = createApi(true);
    api.createReservation.mockImplementation(() => new Observable<Reservation>(() => undefined));
    const fixture = await open('/screenings/1/checkout', api);

    fillValid(fixture);
    await settle(fixture);
    query(fixture, 'pay-button')?.click();
    await settle(fixture);

    expect((query(fixture, 'pay-button') as HTMLButtonElement).disabled).toBe(true);
    expect(text(query(fixture, 'pay-button'))).toBe('Processing…');
    expect(TestBed.inject(Router).url).toBe('/screenings/1/checkout');
  });

  it('a failed payment stays on the form with the values kept and shows the toast', async () => {
    storeBooking();
    const fixture = await open('/screenings/1/checkout', createApi(false));
    const toast = vi
      .spyOn(TestBed.inject(ToastService), 'show')
      .mockImplementation(() => undefined);

    fillValid(fixture);
    await settle(fixture);
    query(fixture, 'pay-button')?.click();
    await settle(fixture);

    expect(toast).toHaveBeenCalledWith('Payment failed. Please try again.');
    expect(TestBed.inject(Router).url).toBe('/screenings/1/checkout');
    expect((query(fixture, 'first-name-input') as HTMLInputElement).value).toBe('Anna');
    expect(text(query(fixture, 'pay-button'))).toBe('Pay 121.00 PLN');
    expect((query(fixture, 'pay-button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('restores the saved values, for example after a reload', async () => {
    storeBooking({ ...VALID, terms: true });
    const fixture = await open('/screenings/1/checkout', createApi(true));

    expect((query(fixture, 'first-name-input') as HTMLInputElement).value).toBe('Anna');
    expect((query(fixture, 'confirm-email-input') as HTMLInputElement).value).toBe(
      'anna.kowalska@example.com',
    );
    expect(query(fixture, 'first-name-error')).toBeNull();
  });

  it('saves the values as they are typed', async () => {
    storeBooking();
    const fixture = await open('/screenings/1/checkout', createApi(true));

    type(fixture, 'last-name-input', 'Kow');
    await settle(fixture);

    expect(JSON.parse(sessionStorage.getItem(BOOKING_KEY) ?? 'null').checkout.lastName).toBe('Kow');
  });

  it('Back returns to the summary with the booking intact', async () => {
    storeBooking();
    const fixture = await open('/screenings/1/checkout', createApi(true));

    query(fixture, 'checkout-back-button')?.click();
    await settle(fixture);

    expect(TestBed.inject(Router).url).toBe('/screenings/1/summary');
    expect(JSON.parse(sessionStorage.getItem(BOOKING_KEY) ?? 'null').seats).toEqual([
      'R15C5',
      'R15C6',
      'R7C12',
    ]);
  });

  it('redirects to / without a booking for the screening', async () => {
    const fixture = await open('/screenings/1/checkout', createApi(true));

    expect(TestBed.inject(Router).url).toBe('/');
    expect(query(fixture, 'checkout-title')).toBeNull();
  });
});
