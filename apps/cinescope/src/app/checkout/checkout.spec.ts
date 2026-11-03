import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BookingService } from '../core/booking.service';
import { AUDITORIUM } from '../core/seat-layout';
import { Checkout } from './checkout';

describe('Checkout', () => {
  const q = (el: HTMLElement, id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  function setup() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Checkout, MatSnackBarModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    });
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.toggle(AUDITORIUM[6].middle[7]);
    booking.toggle(AUDITORIUM[14].middle[0]);
    const fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
    return { fixture, booking, el: fixture.nativeElement as HTMLElement };
  }

  function type(el: HTMLElement, id: string, value: string) {
    const input = q(el, id) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('shows the total and no messages initially', () => {
    const { el } = setup();
    expect(q(el, 'pay-button')!.textContent!.trim()).toBe('Pay 121.00 PLN');
    expect(q(el, 'first-name-error')).toBeNull();
    expect(q(el, 'first-name-label')!.textContent!.trim()).toBe('First name *');
    expect(q(el, 'phone-label')!.textContent!.trim()).toBe('Phone number');
  });

  it('shows all messages on an invalid pay and sends nothing', async () => {
    const { fixture, el } = setup();
    q(el, 'pay-button')!.click();
    await fixture.whenStable();
    expect(q(el, 'first-name-error')!.textContent).toBe('First name is required');
    expect(q(el, 'confirm-email-error')!.textContent).toBe('Confirm email is required');
    expect(q(el, 'phone-error')).toBeNull();
    expect(q(el, 'terms-error')!.textContent).toBe('You must accept the terms and conditions');
    TestBed.inject(HttpTestingController).expectNone('http://localhost:3000/reservations');
  });

  it('validates as the customer types after leaving a field', async () => {
    const { fixture, el } = setup();
    type(el, 'email-input', 'a@b');
    q(el, 'email-input')!.dispatchEvent(new Event('blur'));
    type(el, 'confirm-email-input', 'a@b.c');
    q(el, 'confirm-email-input')!.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(q(el, 'email-error')!.textContent).toBe('Enter a valid email address');
    expect(q(el, 'confirm-email-error')!.textContent).toBe('Email addresses do not match');
    type(el, 'email-input', 'a@b.c');
    await fixture.whenStable();
    expect(q(el, 'email-error')).toBeNull();
    expect(q(el, 'confirm-email-error')).toBeNull();
  });

  it('pays a valid form and marks the booking paid', async () => {
    const { fixture, booking, el } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    type(el, 'first-name-input', 'Anna');
    type(el, 'last-name-input', 'Kowalska');
    type(el, 'email-input', 'anna@example.com');
    type(el, 'confirm-email-input', 'anna@example.com');
    type(el, 'phone-input', '123456789');
    (el.querySelector('[data-testid="terms-checkbox"] input') as HTMLInputElement).click();
    await fixture.whenStable();
    q(el, 'pay-button')!.click();
    await fixture.whenStable();
    expect(q(el, 'pay-button')!.textContent!.trim()).toBe('Processing…');
    const req = TestBed.inject(HttpTestingController).expectOne('http://localhost:3000/reservations');
    expect(req.request.body).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C5', 'R15C6'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '123456789' },
      totalPrice: 121,
    });
    req.flush({ id: 1 });
    expect(booking.booking()?.paid).toBe(true);
    expect(booking.booking()?.email).toBe('anna@example.com');
    expect(navigate).toHaveBeenCalledWith('/confirmation');
  });
});
