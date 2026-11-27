import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BookingService } from '../core/booking.service';
import { Checkout } from './checkout';

describe('Checkout', () => {
  function setup() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    });
    const booking = TestBed.inject(BookingService);
    booking.startFor(1);
    booking.add('R7C12');
    booking.add('R15C1');
    const fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const q = (el: HTMLElement, id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  it('shows the total and validates on pay', async () => {
    const { fixture, el } = setup();
    expect(q(el, 'pay-button')!.textContent!.trim()).toBe('Pay 121.00 PLN');
    expect(q(el, 'first-name-error')).toBeNull();
    q(el, 'pay-button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(q(el, 'first-name-error')!.textContent!.trim()).toBe('First name is required');
    expect(q(el, 'confirm-email-error')!.textContent!.trim()).toBe('Confirm email is required');
    expect(q(el, 'terms-error')!.textContent!.trim()).toBe('You must accept the terms and conditions');
    expect(q(el, 'phone-error')).toBeNull();
  });

  it('checks email, confirmation and phone and keeps values', async () => {
    const { fixture, el } = setup();
    const type = (id: string, value: string) => {
      const input = q(el, id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    };
    type('email-input', 'a@b');
    type('confirm-email-input', 'a@b.com');
    type('phone-input', '12345');
    expect(q(el, 'email-error')!.textContent!.trim()).toBe('Enter a valid email address');
    expect(q(el, 'confirm-email-error')!.textContent!.trim()).toBe('Email addresses do not match');
    expect(q(el, 'phone-error')!.textContent!.trim()).toBe('Phone number must be exactly 9 digits');
    type('email-input', 'a@b.com');
    expect(q(el, 'email-error')).toBeNull();
    expect(q(el, 'confirm-email-error')).toBeNull();
    expect(TestBed.inject(BookingService).booking()!.form.email).toBe('a@b.com');
  });
});
