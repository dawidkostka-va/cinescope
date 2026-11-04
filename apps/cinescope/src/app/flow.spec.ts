import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from './app.routes';

const screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R15C6'],
};
const movie = { id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' };

describe('booking flow', () => {
  let http!: HttpTestingController;
  let harness!: RouterTestingHarness;
  const root = () => harness.routeNativeElement as HTMLElement;

  const q = <T extends HTMLElement>(id: string) => root().querySelector<T>(`[data-testid="${id}"]`);
  const all = (id: string) => Array.from(root().querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
  const text = (id: string) => (id === 'toast' ? document.querySelector('[data-testid="toast"]') : q(id))?.textContent?.trim();
  const seat = (row: number, column: number) =>
    root().querySelector<HTMLElement>(`[data-testid="seat"][data-row="${row}"][data-column="${column}"]`)!;
  const couch = (row: number, start: number) =>
    root().querySelector<HTMLElement>(`[data-testid="couch"][data-row="${row}"][data-column-start="${start}"]`)!;
  const click = async (e: HTMLElement) => {
    e.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  };
  const type = async (id: string, value: string) => {
    const input = q<HTMLInputElement>(id)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await harness.fixture.whenStable();
    harness.detectChanges();
  };
  const flush = async () => {
    await harness.fixture.whenStable();
    harness.detectChanges();
  };
  const respond = async (url: string, body: object) => {
    let found: ReturnType<HttpTestingController['match']> = [];
    await vi.waitFor(() => {
      found = http.match(url);
      expect(found.length).toBe(1);
    });
    found[0].flush(body);
    await flush();
  };
  const loadScreening = async () => {
    await respond('http://localhost:3000/screenings/1', screening);
    await respond('http://localhost:3000/movies/1', movie);
  };

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(appRoutes), provideHttpClient(), provideHttpClientTesting(), provideNativeDateAdapter()],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  it('redirects guarded routes without a booking', async () => {
    await harness.navigateByUrl('/screenings/1/summary');
    expect(TestBed.inject(Router).url).toBe('/');
    await harness.navigateByUrl('/confirmation');
    expect(TestBed.inject(Router).url).toBe('/');
    http.match(() => true);
  });

  it('goes from the seat map to a paid reservation', async () => {
    const nav = harness.navigateByUrl('/screenings/1/seats');
    await Promise.resolve();
    await loadScreening();
    await nav;
    harness.detectChanges();

    expect(text('seat-map-subtitle')).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(all('seat-row').length).toBe(15);
    expect(all('seat').length + all('couch').length).toBe(308);
    expect(all('aisle').length).toBe(30);
    expect(seat(3, 7).dataset['state']).toBe('unavailable');
    expect(couch(15, 5).dataset['state']).toBe('unavailable');
    expect(seat(1, 10).dataset['state']).toBe('accessible');

    await click(seat(3, 7));
    expect(text('selected-seats-count')).toBe('Selected seats: 0');

    await click(seat(1, 10));
    await click(seat(7, 12));
    await click(seat(7, 11));
    await click(couch(15, 1));
    expect(seat(1, 10).dataset['state']).toBe('selected');
    expect(text('selected-seats-count')).toBe('Selected seats: 5');
    expect(all('selected-seats-row').map((r) => r.textContent?.trim())).toEqual(['Row 1: 10', 'Row 7: 11, 12', 'Row 15: 1-2']);

    await click(couch(15, 3));
    await click(couch(15, 7));
    await click(couch(15, 9));
    expect(text('selected-seats-count')).toBe('Selected seats: 9');
    expect(text('toast')).toBe('Maximum 10 seats per booking');
  });

  it('enforces the 10 seat limit', async () => {
    const nav = harness.navigateByUrl('/screenings/1/seats');
    await Promise.resolve();
    await loadScreening();
    await nav;
    for (const c of [1, 3, 7, 9]) await click(couch(15, c));
    expect(text('selected-seats-count')).toBe('Selected seats: 8');
    await click(seat(2, 5));
    expect(text('selected-seats-count')).toBe('Selected seats: 9');
    await click(couch(15, 11));
    expect(text('selected-seats-count')).toBe('Selected seats: 9');
    expect(text('toast')).toBe('Maximum 10 seats per booking');
    await click(seat(2, 6));
    await click(seat(2, 7));
    expect(text('selected-seats-count')).toBe('Selected seats: 10');
    await click(couch(15, 1));
    expect(text('selected-seats-count')).toBe('Selected seats: 8');
  });

  it('runs summary, checkout and payment', async () => {
    let nav = harness.navigateByUrl('/screenings/1/seats');
    await Promise.resolve();
    await loadScreening();
    await nav;
    await click(seat(7, 12));
    await click(couch(15, 1));
    await click(seat(1, 10));
    await click(q('continue-button')!);

    await loadScreening();

    expect(TestBed.inject(Router).url).toBe('/screenings/1/summary');
    expect(all('summary-item').length).toBe(3);
    expect(all('summary-item-price').map((e) => e.textContent?.trim())).toEqual(['25.00 PLN', '32.00 PLN', '89.00 PLN']);
    expect(all('summary-item-seat').map((e) => e.textContent?.trim())).toEqual(['10', '12', 'Couch 1-2']);
    expect(text('summary-total')).toBe('Total: 146.00 PLN');

    await click(all('summary-item-remove-button')[0]);
    expect(text('summary-total')).toBe('Total: 121.00 PLN');
    await click(q('confirm-button')!);

    expect(TestBed.inject(Router).url).toBe('/screenings/1/checkout');
    expect(text('pay-button')).toBe('Pay 121.00 PLN');
    expect(q('first-name-error')).toBeNull();

    await click(q('pay-button')!);
    expect(text('toast')).toBe('The form contains errors');
    expect(text('first-name-error')).toBe('First name is required');
    expect(text('confirm-email-error')).toBe('Confirm email is required');
    expect(text('terms-error')).toBe('You must accept the terms and conditions');
    expect(q('phone-error')).toBeNull();

    await type('first-name-input', 'A');
    expect(text('first-name-error')).toBe('First name must be at least 2 characters');
    await type('first-name-input', 'Anna');
    await type('last-name-input', 'Kowalska');
    await type('email-input', 'a@b');
    expect(text('email-error')).toBe('Enter a valid email address');
    await type('email-input', 'anna@example.com');
    await type('confirm-email-input', 'anna@example.org');
    expect(text('confirm-email-error')).toBe('Email addresses do not match');
    await type('confirm-email-input', 'anna@example.com');
    await type('phone-input', '12345');
    expect(text('phone-error')).toBe('Phone number must be exactly 9 digits');
    await type('phone-input', '123456789');
    await click(q('terms-checkbox')!.querySelector('input')!);
    expect(q('terms-error')).toBeNull();

    expect(JSON.parse(sessionStorage.getItem('cinescope.booking')!).form.firstName).toBe('Anna');

    await click(q('pay-button')!);
    expect(text('pay-button')).toBe('Processing…');
    expect(q<HTMLButtonElement>('pay-button')!.disabled).toBe(true);
    const req = http.expectOne('http://localhost:3000/reservations');
    expect(req.request.body).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '123456789' },
      totalPrice: 121,
    });
    req.flush('boom', { status: 500, statusText: 'err' });
    await flush();
    await vi.waitFor(() => expect(text('toast')).toBe('Payment failed. Please try again.'));
    expect(q<HTMLButtonElement>('pay-button')!.disabled).toBe(false);

    await click(q('pay-button')!);
    http.expectOne('http://localhost:3000/reservations').flush({ id: 1 });
    await flush();
    await flush();
    expect(TestBed.inject(Router).url).toBe('/confirmation');
    expect(text('confirmation-message')).toBe('Your tickets will be sent shortly to anna@example.com');

    nav = harness.navigateByUrl('/screenings/1/seats');
    await Promise.resolve();
    await loadScreening();
    await nav;
    expect(text('selected-seats-count')).toBe('Selected seats: 0');
  });
});
