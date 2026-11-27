import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BookingStore } from '../booking';
import { CheckoutPage } from './checkout-page';

describe('CheckoutPage', () => {
  function setup() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'confirmation', children: [] }]),
      ],
    });
    const booking = TestBed.inject(BookingStore);
    booking.startNew(1);
    booking.toggle({ row: 7, column: 12 });
    booking.toggle({ row: 15, column: 1 });
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, booking };
  }
  const q = (el: HTMLElement, id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const type = (el: HTMLElement, id: string, value: string) => {
    const input = q(el, id) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('shows messages after blur and on invalid pay, and keeps values', async () => {
    const { fixture, el, booking } = setup();
    expect(q(el, 'pay-button')?.textContent?.trim()).toBe('Pay 121.00 PLN');
    expect(q(el, 'first-name-error')).toBeNull();

    q(el, 'pay-button')!.click();
    fixture.detectChanges();
    expect(q(el, 'first-name-error')?.textContent).toBe('First name is required');
    expect(q(el, 'confirm-email-error')?.textContent).toBe('Confirm email is required');
    expect(q(el, 'terms-error')?.textContent).toBe('You must accept the terms and conditions');
    expect(q(el, 'phone-error')).toBeNull();

    type(el, 'first-name-input', 'A');
    type(el, 'email-input', 'a@.com');
    type(el, 'confirm-email-input', 'a@b.com');
    type(el, 'phone-input', '12345678');
    fixture.detectChanges();
    expect(q(el, 'first-name-error')?.textContent).toBe('First name must be at least 2 characters');
    expect(q(el, 'email-error')?.textContent).toBe('Enter a valid email address');
    expect(q(el, 'confirm-email-error')?.textContent).toBe('Email addresses do not match');
    expect(q(el, 'phone-error')?.textContent).toBe('Phone number must be exactly 9 digits');

    type(el, 'email-input', 'a@b.com');
    fixture.detectChanges();
    expect(q(el, 'confirm-email-error')).toBeNull();
    expect(booking.form().firstName).toBe('A');
  });

  it('sends the reservation', async () => {
    const { fixture, el, booking } = setup();
    type(el, 'first-name-input', 'Anna');
    type(el, 'last-name-input', 'Kowalska');
    type(el, 'email-input', 'anna@example.com');
    type(el, 'confirm-email-input', 'anna@example.com');
    (q(el, 'terms-checkbox')!.querySelector('input') as HTMLInputElement).click();
    fixture.detectChanges();
    q(el, 'pay-button')!.click();
    fixture.detectChanges();
    expect(q(el, 'pay-button')?.textContent?.trim()).toBe('Processing…');
    const req = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/reservations',
    );
    expect(req.request.body).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '' },
      totalPrice: 121,
    });
    req.flush({ id: 1 });
    expect(booking.paid()).toBe(true);
    expect(booking.email()).toBe('anna@example.com');
  });
});
