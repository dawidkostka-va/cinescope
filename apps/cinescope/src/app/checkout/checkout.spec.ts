import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BookingService } from '../core/booking.service';
import { Checkout } from './checkout';

describe('Checkout', () => {
  let fixture: ComponentFixture<Checkout>;
  let root: HTMLElement;
  let booking: BookingService;

  const input = (id: string) => {
    const found = root.querySelector<HTMLInputElement>(`[data-testid="${id}"]`);
    if (!found) {
      throw new Error(id);
    }
    return found;
  };
  const error = (id: string) => root.querySelector(`[data-testid="${id}-error"]`)?.textContent?.trim() ?? null;
  const type = async (id: string, value: string, blur = true) => {
    const el = input(id);
    el.value = value;
    el.dispatchEvent(new Event('input'));
    if (blur) {
      el.dispatchEvent(new Event('blur'));
    }
    await fixture.whenStable();
  };

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.setSeats(['R7C12', 'R15C1', 'R15C2', 'R1C1']);
    fixture = TestBed.createComponent(Checkout);
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('shows the pay button with the total', () => {
    expect(input('pay-button').textContent?.trim()).toBe('Pay 146.00 PLN');
  });

  it('shows messages only after a field was left', async () => {
    await type('first-name-input', 'A', false);
    expect(error('first-name')).toBeNull();
    await type('first-name-input', 'A');
    expect(error('first-name')).toBe('First name must be at least 2 characters');
    await type('first-name-input', '');
    expect(error('first-name')).toBe('First name is required');
    await type('first-name-input', 'Anna');
    expect(error('first-name')).toBeNull();
  });

  it('re-evaluates confirm email when email changes', async () => {
    await type('email-input', 'anna@example.com');
    await type('confirm-email-input', 'anna@example.com');
    expect(error('confirm-email')).toBeNull();
    await type('email-input', 'anna@example.org');
    expect(error('confirm-email')).toBe('Email addresses do not match');
    await type('email-input', 'a@.com');
    expect(error('email')).toBe('Enter a valid email address');
  });

  it('validates phone', async () => {
    await type('phone-input', '12345678');
    expect(error('phone')).toBe('Phone number must be exactly 9 digits');
    await type('phone-input', '');
    expect(error('phone')).toBeNull();
    await type('phone-input', '123456789');
    expect(error('phone')).toBeNull();
  });

  it('flags every field on an invalid pay and sends no request', async () => {
    const http = TestBed.inject(HttpTestingController);
    input('pay-button').click();
    await fixture.whenStable();
    expect(error('first-name')).toBe('First name is required');
    expect(error('last-name')).toBe('Last name is required');
    expect(error('email')).toBe('Email is required');
    expect(error('confirm-email')).toBe('Confirm email is required');
    expect(error('phone')).toBeNull();
    expect(error('terms')).toBe('You must accept the terms and conditions');
    expect(document.querySelector('[data-testid="toast"]')?.textContent).toContain('The form contains errors');
    http.expectNone(() => true);
  });

  it('keeps the values in the booking and pays', async () => {
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await type('first-name-input', 'Anna');
    await type('last-name-input', 'Kowalska');
    await type('email-input', 'anna@example.com');
    await type('confirm-email-input', 'anna@example.com');
    input('terms-checkbox').querySelector('input')?.click();
    await fixture.whenStable();
    expect(booking.booking()?.form).toMatchObject({ firstName: 'Anna', email: 'anna@example.com', terms: true });

    input('pay-button').click();
    await fixture.whenStable();
    expect(input('pay-button').textContent?.trim()).toBe('Processing…');
    expect(input('pay-button').hasAttribute('disabled')).toBe(true);
    const request = http.expectOne('http://localhost:3000/reservations');
    expect(request.request.body).toEqual({
      screeningId: 1,
      seats: ['R1C1', 'R7C12', 'R15C1', 'R15C2'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '' },
      totalPrice: 146,
    });
    request.flush({ id: 5 });
    expect(booking.booking()).toMatchObject({ paid: true, email: 'anna@example.com' });
    expect(navigate).toHaveBeenCalledWith('/confirmation');
  });
});
