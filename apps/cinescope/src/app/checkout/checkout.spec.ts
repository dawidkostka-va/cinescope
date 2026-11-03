import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { BookingStore } from '../core/booking';
import { Checkout } from './checkout';

describe('Checkout', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '1']]) } } },
      ],
    });
    const store = TestBed.inject(BookingStore);
    store.start(1);
    store.setSeats(['R7C12', 'R15C1', 'R15C2']);
  });

  const open = () => {
    const fixture = TestBed.createComponent(Checkout);
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };
  const q = (el: HTMLElement, id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const type = async (fixture: { whenStable(): Promise<void> }, el: HTMLElement, id: string, value: string) => {
    const input = q(el, id) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const blur = async (fixture: { whenStable(): Promise<void> }, el: HTMLElement, id: string) => {
    q(el, id)!.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  };

  it('shows the pay total and labels', async () => {
    const { fixture, el } = open();
    await fixture.whenStable();
    expect(q(el, 'pay-button')?.textContent?.trim()).toBe('Pay 121.00 PLN');
    expect(q(el, 'first-name-label')?.textContent).toBe('First name *');
    expect(q(el, 'phone-label')?.textContent).toBe('Phone number');
  });

  it('validates fields after blur and re-checks confirm email', async () => {
    const { fixture, el } = open();
    await fixture.whenStable();
    expect(q(el, 'first-name-error')).toBeNull();
    await blur(fixture, el, 'first-name-input');
    expect(q(el, 'first-name-error')?.textContent).toBe('First name is required');
    await type(fixture, el, 'first-name-input', 'A');
    expect(q(el, 'first-name-error')?.textContent).toBe('First name must be at least 2 characters');
    await type(fixture, el, 'first-name-input', 'An');
    expect(q(el, 'first-name-error')).toBeNull();

    await type(fixture, el, 'email-input', 'a@b');
    await blur(fixture, el, 'email-input');
    expect(q(el, 'email-error')?.textContent).toBe('Enter a valid email address');
    await type(fixture, el, 'confirm-email-input', 'a@b.pl');
    await blur(fixture, el, 'confirm-email-input');
    expect(q(el, 'confirm-email-error')?.textContent).toBe('Email addresses do not match');
    await type(fixture, el, 'email-input', 'a@b.pl');
    expect(q(el, 'confirm-email-error')).toBeNull();
    expect(q(el, 'email-error')).toBeNull();

    await type(fixture, el, 'phone-input', '12345678');
    await blur(fixture, el, 'phone-input');
    expect(q(el, 'phone-error')?.textContent).toBe('Phone number must be exactly 9 digits');
    expect(TestBed.inject(BookingStore).current()?.form.email).toBe('a@b.pl');
  });

  it('refuses to pay an invalid form, then pays a valid one', async () => {
    const { fixture, el } = open();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
    q(el, 'pay-button')!.click();
    await fixture.whenStable();
    http.expectNone('http://localhost:3000/reservations');
    expect(q(el, 'terms-error')?.textContent).toBe('You must accept the terms and conditions');
    expect(q(el, 'confirm-email-error')?.textContent).toBe('Confirm email is required');
    expect(document.querySelector('[data-testid=toast]')?.textContent).toBe('The form contains errors');

    await type(fixture, el, 'first-name-input', 'Anna');
    await type(fixture, el, 'last-name-input', 'Kowalska');
    await type(fixture, el, 'email-input', 'anna@example.com');
    await type(fixture, el, 'confirm-email-input', 'anna@example.com');
    (q(el, 'terms-checkbox')!.querySelector('input') as HTMLInputElement).click();
    await fixture.whenStable();
    q(el, 'pay-button')!.click();
    await fixture.whenStable();
    const req = http.expectOne('http://localhost:3000/reservations');
    expect(req.request.body).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '' },
      totalPrice: 121,
    });
    expect(q(el, 'pay-button')?.textContent?.trim()).toBe('Processing…');
    expect((q(el, 'pay-button') as HTMLButtonElement).disabled).toBe(true);
    req.flush({ id: 1 });
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith('/confirmation');
    expect(TestBed.inject(BookingStore).current()).toMatchObject({ paid: true, email: 'anna@example.com' });
  });
});
