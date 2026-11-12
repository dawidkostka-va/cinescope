import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BookingService } from '../core/booking.service';
import { inProgressBookingGuard } from '../core/guards';
import { Checkout } from './checkout';

describe('Checkout', () => {
  beforeEach(() => sessionStorage.clear());

  async function open() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: Checkout },
          {
            path: 'screenings/:id/checkout',
            canActivate: [inProgressBookingGuard],
            component: Checkout,
          },
          { path: 'confirmation', component: Checkout },
        ]),
        provideNativeDateAdapter(),
      ],
    });
    const booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.setItems(['R15C1', 'R7C12', 'R15C3']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/screenings/1/checkout');
    const el: HTMLElement = harness.fixture.nativeElement;
    const q = (id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    const type = (id: string, value: string) => {
      const input = q(id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      harness.detectChanges();
    };
    return { harness, q, type, booking, http: TestBed.inject(HttpTestingController) };
  }

  it('redirects without a matching booking', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'screenings/:id/checkout', canActivate: [inProgressBookingGuard], component: Checkout }, { path: '', component: Checkout }])],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/screenings/1/checkout');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('shows messages after blur, keeps values and pays', async () => {
    const { harness, q, type, booking, http } = await open();
    expect(q('pay-button')!.textContent!.trim()).toBe('Pay 210.00 PLN');
    expect(q('first-name-error')).toBeNull();

    q('first-name-input')!.dispatchEvent(new Event('blur'));
    harness.detectChanges();
    expect(q('first-name-error')!.textContent).toBe('First name is required');
    type('first-name-input', 'A');
    expect(q('first-name-error')!.textContent).toBe('First name must be at least 2 characters');

    (q('pay-button') as HTMLButtonElement).click();
    harness.detectChanges();
    expect(q('confirm-email-error')!.textContent).toBe('Confirm email is required');
    expect(q('terms-error')!.textContent).toBe('You must accept the terms and conditions');
    const toasts = document.querySelectorAll('[data-testid="toast"]');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('The form contains errors');
    http.expectNone('http://localhost:3000/reservations');

    type('first-name-input', 'Anna');
    type('last-name-input', 'Kowalska');
    type('email-input', 'anna@example.com');
    type('confirm-email-input', 'anna@example.com');
    type('phone-input', '123456789');
    (q('terms-checkbox')!.querySelector('input') as HTMLInputElement).click();
    harness.detectChanges();
    expect(booking.booking()?.form.firstName).toBe('Anna');
    expect(booking.booking()?.form.terms).toBe(true);

    (q('pay-button') as HTMLButtonElement).click();
    harness.detectChanges();
    expect((q('pay-button') as HTMLButtonElement).disabled).toBe(true);
    expect(q('pay-button')!.textContent!.trim()).toBe('Processing…');
    const req = http.expectOne('http://localhost:3000/reservations');
    expect(req.request.body).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2', 'R15C3', 'R15C4'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '123456789' },
      totalPrice: 210,
    });
    req.flush('x', { status: 500, statusText: 'err' });
    harness.detectChanges();
    expect((q('pay-button') as HTMLButtonElement).disabled).toBe(false);
    expect(booking.booking()?.paid).toBe(false);

    (q('pay-button') as HTMLButtonElement).click();
    http.expectOne('http://localhost:3000/reservations').flush({ id: 1 });
    await harness.fixture.whenStable();
    expect(booking.booking()?.paid).toBe(true);
    expect(booking.booking()?.email).toBe('anna@example.com');
  });
});
