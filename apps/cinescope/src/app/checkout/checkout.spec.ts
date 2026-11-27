import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BookingService } from '../core/booking.service';
import { Checkout } from './checkout';

async function setup() {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'confirmation', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const booking = TestBed.inject(BookingService);
  booking.start(1);
  booking.setSeats(['R7C12', 'R15C1', 'R15C2']);
  const fixture = TestBed.createComponent(Checkout);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const el = <T extends HTMLElement>(id: string) => root.querySelector<T>(`[data-testid=${id}]`);
  const type = async (id: string, value: string, blur = true) => {
    const input = el<HTMLInputElement>(id)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    if (blur) input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  };
  return { fixture, el, type, booking, http: TestBed.inject(HttpTestingController) };
}

describe('Checkout', () => {
  it('validates fields after blur', async () => {
    const { el, type } = await setup();
    expect(el('first-name-error')).toBeNull();
    await type('first-name-input', '');
    expect(el('first-name-error')?.textContent).toBe('First name is required');
    await type('first-name-input', 'A');
    expect(el('first-name-error')?.textContent).toBe('First name must be at least 2 characters');
    await type('first-name-input', 'An');
    expect(el('first-name-error')).toBeNull();
    await type('email-input', 'a@.com');
    expect(el('email-error')?.textContent).toBe('Enter a valid email address');
    await type('confirm-email-input', 'x@y.com');
    expect(el('confirm-email-error')?.textContent).toBe('Email addresses do not match');
    await type('email-input', 'x@y.com', false);
    expect(el('confirm-email-error')).toBeNull();
    await type('phone-input', '12345678');
    expect(el('phone-error')?.textContent).toBe('Phone number must be exactly 9 digits');
    await type('phone-input', '');
    expect(el('phone-error')).toBeNull();
  });

  it('shows all errors on invalid pay and keeps values', async () => {
    const { fixture, el, type, booking } = await setup();
    expect(el('pay-button')?.textContent?.trim()).toBe('Pay 121.00 PLN');
    el('pay-button')!.click();
    await fixture.whenStable();
    expect(el('first-name-error')?.textContent).toBe('First name is required');
    expect(el('confirm-email-error')?.textContent).toBe('Confirm email is required');
    expect(el('terms-error')?.textContent).toBe('You must accept the terms and conditions');
    expect(el('phone-error')).toBeNull();
    await type('last-name-input', 'Kowalska');
    expect(booking.booking().form.lastName).toBe('Kowalska');
  });

  it('pays', async () => {
    const { fixture, el, type, http, booking } = await setup();
    await type('first-name-input', 'Anna');
    await type('last-name-input', 'Kowalska');
    await type('email-input', 'a@b.pl');
    await type('confirm-email-input', 'a@b.pl');
    (el('terms-checkbox')!.querySelector('input') as HTMLInputElement).click();
    await fixture.whenStable();
    el('pay-button')!.click();
    await fixture.whenStable();
    expect(el('pay-button')?.textContent?.trim()).toBe('Processing…');
    const req = http.expectOne('http://localhost:3000/reservations');
    expect(req.request.body).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'a@b.pl', phone: '' },
      totalPrice: 121,
    });
    req.flush({ id: 1 });
    await fixture.whenStable();
    expect(booking.booking().paid).toBe(true);
    expect(booking.booking().email).toBe('a@b.pl');
  });
});
