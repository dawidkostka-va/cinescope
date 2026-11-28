import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Reservation } from '../core/models';
import { CheckoutComponent } from './checkout';

describe('CheckoutComponent', () => {
  const reserve = new Subject<Reservation>();
  const reserveSpy = vi.fn(() => reserve);

  function setup() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        { provide: ApiService, useValue: { reserve: reserveSpy } },
      ],
    });
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.addSeats(['R7C12', 'R15C1', 'R15C2']);
    const fixture = TestBed.createComponent(CheckoutComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const get = (id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    const type = (id: string, value: string) => {
      const input = get(id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const blur = (id: string) => {
      get(id)!.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    };
    return { fixture, get, type, blur, booking };
  }

  it('labels and total', () => {
    const { get } = setup();
    expect(get('first-name-label')?.textContent).toBe('First name *');
    expect(get('phone-label')?.textContent).toBe('Phone number');
    expect(get('pay-button')?.textContent).toBe('Pay 121.00 PLN');
  });

  it('shows messages after blur and re-checks confirm email', () => {
    const { get, type, blur } = setup();
    expect(get('first-name-error')).toBeNull();
    blur('first-name-input');
    expect(get('first-name-error')?.textContent).toBe('First name is required');
    type('first-name-input', 'A');
    expect(get('first-name-error')?.textContent).toBe('First name must be at least 2 characters');
    type('first-name-input', 'An');
    expect(get('first-name-error')).toBeNull();

    type('email-input', 'a@b');
    blur('email-input');
    expect(get('email-error')?.textContent).toBe('Enter a valid email address');
    type('confirm-email-input', 'x@y.pl');
    blur('confirm-email-input');
    expect(get('confirm-email-error')?.textContent).toBe('Email addresses do not match');
    type('email-input', 'x@y.pl');
    expect(get('confirm-email-error')).toBeNull();

    type('phone-input', '12345678');
    blur('phone-input');
    expect(get('phone-error')?.textContent).toBe('Phone number must be exactly 9 digits');
    type('phone-input', '');
    expect(get('phone-error')).toBeNull();
  });

  it('rejects an invalid form and pays a valid one', () => {
    const { fixture, get, type, booking } = setup();
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    get('pay-button')!.click();
    fixture.detectChanges();
    expect(reserveSpy).not.toHaveBeenCalled();
    expect(get('terms-error')?.textContent).toBe('You must accept the terms and conditions');
    expect(get('confirm-email-error')?.textContent).toBe('Confirm email is required');

    type('first-name-input', 'Anna');
    type('last-name-input', 'Kowalska');
    type('email-input', 'anna@example.com');
    type('confirm-email-input', 'anna@example.com');
    (get('terms-checkbox')!.querySelector('input') as HTMLInputElement).click();
    fixture.detectChanges();
    get('pay-button')!.click();
    fixture.detectChanges();
    expect(reserveSpy).toHaveBeenCalledWith({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '' },
      totalPrice: 121,
    });
    expect(get('pay-button')?.textContent).toBe('Processing…');
    expect((get('pay-button') as HTMLButtonElement).disabled).toBe(true);
    reserve.next({} as Reservation);
    expect(booking.booking()?.paid).toBe(true);
    expect(booking.booking()?.email).toBe('anna@example.com');
    expect(nav).toHaveBeenCalledWith('/confirmation');
  });
});
