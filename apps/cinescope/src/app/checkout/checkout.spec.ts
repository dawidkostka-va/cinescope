import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService } from '../booking.service';
import { ToastService } from '../toast.service';
import { Checkout } from './checkout';

describe('Checkout', () => {
  const toast = { show: vi.fn() };
  const api = { createReservation: vi.fn() };

  function setup() {
    sessionStorage.clear();
    toast.show.mockClear();
    api.createReservation.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ToastService, useValue: toast },
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    });
    const booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.setSeats(['R7C12', 'R15C1', 'R15C2']);
    const fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    const type = (id: string, value: string) => {
      const input = el(id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const blur = (id: string) => {
      el(id)!.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    };
    return { fixture, root, el, type, blur, booking };
  }

  function fillValid(s: ReturnType<typeof setup>) {
    s.type('first-name-input', 'Anna');
    s.type('last-name-input', 'Kowalska');
    s.type('email-input', 'anna@example.com');
    s.type('confirm-email-input', 'anna@example.com');
    s.type('phone-input', '123456789');
    (s.el('terms-checkbox')!.querySelector('input') as HTMLInputElement).click();
    s.fixture.detectChanges();
  }

  it('shows the total and no messages initially', () => {
    const s = setup();
    expect(s.el('pay-button')!.textContent!.trim()).toBe('Pay 121.00 PLN');
    expect(s.el('first-name-error')).toBeNull();
  });

  it('validates fields after blur', () => {
    const s = setup();
    s.blur('first-name-input');
    expect(s.el('first-name-error')!.textContent).toBe('First name is required');
    s.type('first-name-input', 'A');
    expect(s.el('first-name-error')!.textContent).toBe('First name must be at least 2 characters');
    s.type('first-name-input', 'An');
    expect(s.el('first-name-error')).toBeNull();

    s.type('email-input', 'a@b');
    s.type('confirm-email-input', 'x');
    s.blur('email-input');
    s.blur('confirm-email-input');
    expect(s.el('email-error')!.textContent).toBe('Enter a valid email address');
    expect(s.el('confirm-email-error')!.textContent).toBe('Email addresses do not match');
    s.type('email-input', 'x');
    expect(s.el('confirm-email-error')).toBeNull();

    s.type('phone-input', '12345');
    s.blur('phone-input');
    expect(s.el('phone-error')!.textContent).toBe('Phone number must be exactly 9 digits');
    s.type('phone-input', '');
    expect(s.el('phone-error')).toBeNull();
  });

  it('refuses to pay an invalid form', () => {
    const s = setup();
    s.el('pay-button')!.click();
    s.fixture.detectChanges();
    expect(toast.show).toHaveBeenCalledWith('The form contains errors');
    expect(api.createReservation).not.toHaveBeenCalled();
    for (const id of ['first-name', 'last-name', 'email', 'confirm-email', 'terms']) {
      expect(s.el(`${id}-error`)).not.toBeNull();
    }
    expect(s.el('phone-error')).toBeNull();
    expect(s.el('confirm-email-error')!.textContent).toBe('Confirm email is required');
    expect(s.el('terms-error')!.textContent).toBe('You must accept the terms and conditions');
  });

  it('posts the reservation and marks the booking paid', () => {
    const s = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    api.createReservation.mockReturnValue(of({}));
    fillValid(s);
    s.el('pay-button')!.click();
    expect(api.createReservation).toHaveBeenCalledWith({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '123456789' },
      totalPrice: 121,
    });
    expect(s.booking.booking()!.paid).toBe(true);
    expect(s.booking.booking()!.email).toBe('anna@example.com');
    expect(navigate).toHaveBeenCalledWith('/confirmation');
  });

  it('keeps the form and toasts when payment fails', () => {
    const s = setup();
    api.createReservation.mockReturnValue(throwError(() => new Error('boom')));
    fillValid(s);
    s.el('pay-button')!.click();
    s.fixture.detectChanges();
    expect(toast.show).toHaveBeenCalledWith('Payment failed. Please try again.');
    expect((s.el('pay-button') as HTMLButtonElement).disabled).toBe(false);
    expect(s.booking.booking()!.paid).toBe(false);
    expect(s.booking.booking()!.form.firstName).toBe('Anna');
  });
});
