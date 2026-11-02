import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BookingService } from '../core/booking.service';
import { CheckoutComponent } from './checkout';

const q = (el: HTMLElement, testid: string) => el.querySelector<HTMLElement>(`[data-testid="${testid}"]`);

describe('CheckoutComponent', () => {
  function setup() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'confirmation', children: [] }]), provideHttpClient(), provideHttpClientTesting()],
    });
    const booking = TestBed.inject(BookingService);
    booking.openFor(0);
    booking.addSeats(['R7C12', 'R15C1', 'R15C2']);
    const fixture = TestBed.createComponent(CheckoutComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, booking, http: TestBed.inject(HttpTestingController) };
  }

  const type = (el: HTMLElement, id: string, value: string) => {
    const input = q(el, id) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('shows total and no messages initially', () => {
    const { el } = setup();
    expect(q(el, 'pay-button')!.textContent!.trim()).toBe('Pay 121.00 PLN');
    expect(el.querySelectorAll('[data-testid$="-error"]')).toHaveLength(0);
  });

  it('validates on blur and on pay without sending a request', async () => {
    const { fixture, el, http } = setup();
    (q(el, 'first-name-input') as HTMLInputElement).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(q(el, 'first-name-error')!.textContent).toBe('First name is required');
    type(el, 'first-name-input', 'A');
    fixture.detectChanges();
    expect(q(el, 'first-name-error')!.textContent).toBe('First name must be at least 2 characters');

    q(el, 'pay-button')!.click();
    fixture.detectChanges();
    expect(q(el, 'confirm-email-error')!.textContent).toBe('Confirm email is required');
    expect(q(el, 'terms-error')!.textContent).toBe('You must accept the terms and conditions');
    expect(q(el, 'phone-error')).toBeNull();
    http.expectNone('http://localhost:3000/reservations');
  });

  it('sends the reservation when valid and stores the paid booking', () => {
    const { fixture, el, booking, http } = setup();
    type(el, 'first-name-input', 'Anna');
    type(el, 'last-name-input', 'Kowalska');
    type(el, 'email-input', 'anna@example.com');
    type(el, 'confirm-email-input', 'anna@example.com');
    type(el, 'phone-input', '123456789');
    (q(el, 'terms-checkbox')!.querySelector('input') as HTMLInputElement).click();
    fixture.detectChanges();
    q(el, 'pay-button')!.click();
    fixture.detectChanges();
    expect(q(el, 'pay-button')!.textContent!.trim()).toBe('Processing…');
    expect((q(el, 'pay-button') as HTMLButtonElement).disabled).toBe(true);
    const req = http.expectOne('http://localhost:3000/reservations');
    expect(req.request.body).toEqual({
      screeningId: 0,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '123456789' },
      totalPrice: 121,
    });
    req.flush({ id: 1 });
    expect(booking.booking()?.paid).toBe(true);
    expect(booking.booking()?.email).toBe('anna@example.com');
  });
});
