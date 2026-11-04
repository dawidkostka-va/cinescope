import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import type { MockInstance } from 'vitest';
import { BookingService } from '../booking.service';
import { ToastService } from '../toast/toast.service';
import { Checkout } from './checkout';

const API = 'http://localhost:3000';

describe('Checkout', () => {
  let fixture: ComponentFixture<Checkout>;
  let http: HttpTestingController;
  let navigate: MockInstance;
  let toast: MockInstance;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } },
      ],
    });
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.toggle({ row: 2, column: 11, couch: false });
    booking.toggle({ row: 15, column: 3, couch: true });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    toast = vi.spyOn(TestBed.inject(ToastService), 'show');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function one(testId: string): HTMLElement {
    return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
  }

  function text(testId: string): string | null {
    return one(testId)?.textContent?.trim() ?? null;
  }

  function type(testId: string, value: string): void {
    const input = one(testId) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function leave(testId: string): void {
    one(testId).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function fillValid(): void {
    type('first-name-input', 'Anna');
    type('last-name-input', 'Kowalska');
    type('email-input', 'anna@example.com');
    type('confirm-email-input', 'anna@example.com');
    one('terms-checkbox').querySelector('input')?.click();
    fixture.detectChanges();
  }

  function pay(): void {
    (one('pay-button') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('shows the title and the labels with asterisks on required fields only', () => {
    expect(text('checkout-title')).toBe('Your details');
    expect(text('first-name-label')).toBe('First name *');
    expect(text('last-name-label')).toBe('Last name *');
    expect(text('email-label')).toBe('Email *');
    expect(text('confirm-email-label')).toBe('Confirm email *');
    expect(text('phone-label')).toBe('Phone number');
    expect(text('terms-label')).toBe('I accept the terms and conditions *');
  });

  it('shows a message only after the field has been left', () => {
    type('first-name-input', 'A');
    expect(one('first-name-error')).toBeNull();
    leave('first-name-input');
    expect(text('first-name-error')).toBe('First name must be at least 2 characters');
    type('first-name-input', 'An');
    expect(one('first-name-error')).toBeNull();
  });

  it('marks every field and shows a toast when paying with an invalid form', () => {
    pay();
    expect(text('first-name-error')).toBe('First name is required');
    expect(text('email-error')).toBe('Email is required');
    expect(text('confirm-email-error')).toBe('Confirm email is required');
    expect(text('terms-error')).toBe('You must accept the terms and conditions');
    expect(one('phone-error')).toBeNull();
    expect(toast).toHaveBeenCalledWith('The form contains errors');
    expect(navigate).not.toHaveBeenCalled();
    http.expectNone(`${API}/reservations`);
  });

  it('sends the reservation, marks the booking paid and opens the confirmation', () => {
    fillValid();
    expect(text('pay-button')).toBe('Pay 114.00 PLN');
    pay();

    const request = http.expectOne({ method: 'POST', url: `${API}/reservations` });
    expect(request.request.body).toEqual({
      screeningId: 1,
      seats: ['R2C11', 'R15C3', 'R15C4'],
      customer: {
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna@example.com',
        phone: '',
      },
      totalPrice: 114,
    });
    expect(one('pay-button')?.hasAttribute('disabled')).toBe(true);
    expect(text('pay-button')).toBe('Processing…');

    request.flush({ id: 1 }, { status: 201, statusText: 'Created' });
    expect(navigate).toHaveBeenCalledWith(['/confirmation']);
    expect(JSON.parse(sessionStorage.getItem('cinescope.booking') ?? '{}').paid).toEqual({
      email: 'anna@example.com',
    });
  });

  it('stays on the form with values kept when the payment fails', () => {
    fillValid();
    pay();
    http
      .expectOne({ method: 'POST', url: `${API}/reservations` })
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(toast).toHaveBeenCalledWith('Payment failed. Please try again.');
    expect(navigate).not.toHaveBeenCalled();
    expect(one('pay-button')?.hasAttribute('disabled')).toBe(false);
    expect(text('pay-button')).toBe('Pay 114.00 PLN');
    expect((one('first-name-input') as HTMLInputElement).value).toBe('Anna');
  });

  it('restores the typed values when the checkout is opened again', () => {
    fillValid();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } },
      ],
    });
    const restored = TestBed.createComponent(Checkout);
    restored.detectChanges();
    expect(
      (restored.nativeElement.querySelector('[data-testid="email-input"]') as HTMLInputElement)
        .value,
    ).toBe('anna@example.com');
    expect(restored.nativeElement.querySelector('[data-testid="first-name-error"]')).toBeNull();
  });

  it('Back opens the summary', () => {
    (one('checkout-back-button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/screenings', 1, 'summary']);
  });
});
