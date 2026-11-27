import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BookingService } from '../booking';
import { ToastService } from '../toast';
import { Checkout } from './checkout';

const BOOKING = { screeningId: 1, seats: ['R7C12', 'R15C1', 'R15C2'] };

function input(fixture: ComponentFixture<Checkout>, testId: string): HTMLInputElement {
  return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLInputElement;
}

function text(fixture: ComponentFixture<Checkout>, testId: string): string | null {
  return (
    (
      fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null
    )?.textContent?.trim() ?? null
  );
}

/** Types a value into a field and leaves it, as a customer would. */
function type(fixture: ComponentFixture<Checkout>, testId: string, value: string): void {
  const element = input(fixture, testId);
  element.value = value;
  element.dispatchEvent(new Event('input'));
  element.dispatchEvent(new Event('blur'));
  fixture.detectChanges();
}

function fillValidForm(fixture: ComponentFixture<Checkout>): void {
  type(fixture, 'first-name-input', 'Anna');
  type(fixture, 'last-name-input', 'Kowalska');
  type(fixture, 'email-input', 'anna.kowalska@example.com');
  type(fixture, 'confirm-email-input', 'anna.kowalska@example.com');
  input(fixture, 'terms-checkbox').querySelector('input')?.click();
  fixture.detectChanges();
}

function pay(fixture: ComponentFixture<Checkout>): void {
  (fixture.nativeElement.querySelector('[data-testid="pay-button"]') as HTMLButtonElement).click();
  fixture.detectChanges();
}

describe('Checkout', () => {
  let fixture: ComponentFixture<Checkout>;
  let httpMock: HttpTestingController;
  let toast: ToastService;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    sessionStorage.setItem('cinescope.booking', JSON.stringify(BOOKING));
    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'confirmation', children: [] }]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('shows the title, the total and the labels with asterisks on required fields', () => {
    expect(text(fixture, 'checkout-title')).toBe('Your details');
    expect(text(fixture, 'pay-button')).toBe('Pay 121.00 PLN');
    expect(text(fixture, 'first-name-label')).toBe('First name *');
    expect(text(fixture, 'phone-label')).toBe('Phone number');
  });

  it('marks every field and shows the toast on an invalid form, without sending a request', () => {
    const show = vi.spyOn(toast, 'show').mockImplementation(() => undefined);
    pay(fixture);

    expect(text(fixture, 'first-name-error')).toBe('First name is required');
    expect(text(fixture, 'email-error')).toBe('Email is required');
    expect(text(fixture, 'terms-error')).toBe('You must accept the terms and conditions');
    expect(show).toHaveBeenCalledWith('The form contains errors');
    httpMock.expectNone('http://localhost:3000/reservations');
  });

  it('prints the button labels exactly', () => {
    expect(
      (fixture.nativeElement.querySelector('[data-testid="pay-button"]') as HTMLElement).textContent,
    ).toBe('Pay 121.00 PLN');
    expect(
      (fixture.nativeElement.querySelector('[data-testid="checkout-back-button"]') as HTMLElement)
        .textContent,
    ).toBe('Back');
  });

  it('does not navigate when the form is invalid', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(toast, 'show').mockImplementation(() => undefined);
    pay(fixture);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('Back returns to the summary of the screening with the booking intact', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    type(fixture, 'first-name-input', 'Anna');
    (
      fixture.nativeElement.querySelector('[data-testid="checkout-back-button"]') as HTMLButtonElement
    ).click();

    expect(navigate).toHaveBeenCalledWith(['/screenings', 1, 'summary']);
    expect(JSON.parse(sessionStorage.getItem('cinescope.booking') ?? '{}')).toEqual({
      ...BOOKING,
      checkout: expect.objectContaining({ firstName: 'Anna' }),
    });
  });

  it('shows a message once a field has been left', () => {
    type(fixture, 'first-name-input', 'A');
    expect(text(fixture, 'first-name-error')).toBe('First name must be at least 2 characters');
    expect(text(fixture, 'last-name-error')).toBeNull();
  });

  it('sends the reservation, then marks the booking paid and opens the confirmation', async () => {
    fillValidForm(fixture);
    pay(fixture);

    const request = httpMock.expectOne('http://localhost:3000/reservations');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: {
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna.kowalska@example.com',
        phone: '',
      },
      totalPrice: 121,
    });
    expect(text(fixture, 'pay-button')).toBe('Processing…');
    expect(input(fixture, 'first-name-input').value).toBe('Anna');

    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    request.flush({ id: 1, ...request.request.body }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(JSON.parse(sessionStorage.getItem('cinescope.booking') ?? '{}').paidEmail).toBe(
      'anna.kowalska@example.com',
    );
    expect(navigate).toHaveBeenCalledWith('/confirmation');
  });

  it('keeps the form and shows the toast when the payment fails', () => {
    const show = vi.spyOn(toast, 'show').mockImplementation(() => undefined);
    fillValidForm(fixture);
    pay(fixture);

    httpMock
      .expectOne('http://localhost:3000/reservations')
      .flush('error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(show).toHaveBeenCalledWith('Payment failed. Please try again.');
    expect(text(fixture, 'pay-button')).toBe('Pay 121.00 PLN');
    expect(
      (fixture.nativeElement.querySelector('[data-testid="pay-button"]') as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(input(fixture, 'email-input').value).toBe('anna.kowalska@example.com');
  });

  it('keeps the typed values in the booking', () => {
    type(fixture, 'first-name-input', 'Anna');
    const stored = JSON.parse(sessionStorage.getItem('cinescope.booking') ?? '{}');
    expect(stored.checkout.firstName).toBe('Anna');
    expect(stored.seats).toEqual(BOOKING.seats);
  });

  it('restores the values of the booking', () => {
    sessionStorage.setItem(
      'cinescope.booking',
      JSON.stringify({
        ...BOOKING,
        checkout: {
          firstName: 'Ola',
          lastName: 'Nowak',
          email: 'o@example.com',
          confirmEmail: 'o@example.com',
          phone: '',
          terms: true,
        },
      }),
    );
    const restored = TestBed.createComponent(Checkout);
    restored.detectChanges();
    expect(input(restored, 'first-name-input').value).toBe('Ola');
    expect(text(restored, 'first-name-error')).toBeNull();
    expect(TestBed.inject(BookingService).current()?.paidEmail).toBeUndefined();
  });
});
