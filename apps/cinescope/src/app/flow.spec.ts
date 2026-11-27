import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BookingService } from './core/booking.service';
import { addDays, startOfToday, toIso } from './core/dates';
import { Movie, Screening } from './core/models';
import { testProviders } from './testing';

const movies: Movie[] = [
  { id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' },
  { id: 2, title: 'Neon Circuit', genre: 'Sci-Fi', runtimeMinutes: 142, format: 'PL dubbing' },
];
const screening: Screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R15C6', 'R1C10'],
};

const q = (root: HTMLElement, id: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
const one = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const seat = (root: HTMLElement, row: number, col: number) =>
  root.querySelector<HTMLElement>(`[data-testid="seat"][data-row="${row}"][data-column="${col}"]`)!;
const couch = (root: HTMLElement, start: number) =>
  root.querySelector<HTMLElement>(`[data-testid="couch"][data-column-start="${start}"]`)!;

describe('booking flow', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: testProviders() });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  const root = () => harness.routeNativeElement as HTMLElement;
  const settle = async () => {
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
  };

  const respond = async (url: string, body: unknown, opts?: { status: number; statusText: string }) => {
    for (let i = 0; i < 100; i++) {
      const found = http.match(url);
      if (found.length) {
        found[0].flush(body as object, opts);
        await new Promise((r) => setTimeout(r));
        return;
      }
      await new Promise((r) => setTimeout(r, 5));
    }
    throw new Error('no request ' + url);
  };

  const toastText = async (expected: string) => {
    for (let i = 0; i < 100; i++) {
      const toasts = document.querySelectorAll('[data-testid="toast"]');
      if (toasts.length === 1 && toasts[0].textContent === expected) return;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error('toast not shown: ' + expected);
  };

  const drain = () => http.match((r) => r.url.endsWith('/movies') || r.url.endsWith('/screenings'));

  async function openSeats() {
    drain();
    const nav = harness.navigateByUrl('/screenings/1/seats');
    await respond('http://localhost:3000/screenings/1', screening);
    await respond('http://localhost:3000/movies/1', movies[0]);
    await nav;
    await settle();
  }

  it('movie list: loading, error with retry, filtering by day, empty', async () => {
    const tomorrow = toIso(addDays(startOfToday(), 1));
    harness.navigateByUrl(`/?date=${tomorrow}`);
    await settle();
    expect(one(root(), 'movies-loading')).toBeTruthy();
    expect(q(root(), 'movie-card').length).toBe(0);
    expect(q(root(), 'day-button').length).toBe(5);
    expect(q(root(), 'day-button')[0].textContent?.trim()).toBe('Today');
    expect(q(root(), 'day-button')[1].dataset['selected']).toBe('true');
    expect(q(root(), 'day-button')[0].dataset['selected']).toBe('false');

    http.expectOne('http://localhost:3000/movies').error(new ProgressEvent('error'));
    await settle();
    expect(one(root(), 'movies-error').textContent).toContain('Failed to load movies');

    one(root(), 'movies-retry-button').click();
    await settle();
    expect(one(root(), 'movies-loading')).toBeTruthy();
    http.expectOne('http://localhost:3000/movies').flush(movies);
    http.match('http://localhost:3000/screenings').filter((r) => !r.cancelled)[0].flush([
      { id: 5, movieId: 2, date: tomorrow, time: '20:00', occupiedSeats: [] },
      { id: 4, movieId: 2, date: tomorrow, time: '10:30', occupiedSeats: [] },
      { id: 6, movieId: 1, date: '2020-01-01', time: '10:30', occupiedSeats: [] },
    ]);
    await settle();
    const cards = q(root(), 'movie-card');
    expect(cards.length).toBe(1);
    expect(cards[0].dataset['movieId']).toBe('2');
    expect(one(cards[0], 'movie-runtime').textContent).toBe('142 min');
    expect(q(cards[0], 'screening-button').map((b) => b.textContent?.trim())).toEqual(['10:30', '20:00']);

    const router = TestBed.inject(Router);
    await router.navigateByUrl(`/?date=2020-01-01`);
    await settle();
    expect(q(root(), 'day-button')[0].dataset['selected']).toBe('true');
    await router.navigateByUrl(`/?date=2999-02-30`);
    await settle();
    expect(q(root(), 'day-button')[0].dataset['selected']).toBe('true');
    expect(one(root(), 'movies-empty').textContent).toContain('No screenings on this day');
    q(root(), 'day-button')[2].click();
    await settle();
    expect(router.url).toBe(`/?date=${toIso(addDays(startOfToday(), 2))}`);

    await router.navigateByUrl('/nowhere');
    expect(router.url).toBe('/');
  });

  it('seat map geometry, states, selection, cap and panel', async () => {
    await openSeats();
    const el = root();
    expect(one(el, 'seat-map-subtitle').textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(q(el, 'seat-row').length).toBe(15);
    expect(q(el, 'seat').length + q(el, 'couch').length).toBe(308);
    expect(q(el, 'seat').length).toBe(296);
    expect(q(el, 'couch').length).toBe(12);
    expect(q(el, 'aisle').length).toBe(30);
    expect(q(el, 'aisle').every((a) => a.textContent === '')).toBe(true);
    expect(q(el, 'row-label-left').length).toBe(15);
    expect(q(el, 'row-label-right')[14].textContent).toBe('15');
    expect(q(el, 'seat-row')[0].querySelectorAll('[data-testid="seat"]').length).toBe(20);
    expect(q(el, 'seat-row')[10].querySelectorAll('[data-testid="seat"]').length).toBe(24);
    expect(q(el, 'seat-row')[14].querySelectorAll('[data-testid="couch"]').length).toBe(12);
    expect(q(el, 'seat').filter((s) => s.dataset['state'] === 'accessible').length).toBe(5);
    expect(seat(el, 1, 10).dataset['state']).toBe('unavailable');
    expect(seat(el, 1, 11).dataset['state']).toBe('accessible');
    expect(seat(el, 3, 7).dataset['state']).toBe('unavailable');
    expect(couch(el, 5).dataset['state']).toBe('unavailable');
    expect(couch(el, 3).textContent).toBe('3-4');
    expect(q(el, 'legend-item').map((l) => l.textContent?.trim())).toEqual([
      'Available',
      'Selected',
      'Unavailable',
      'Accessible',
    ]);

    seat(el, 3, 7).click();
    await settle();
    expect(one(el, 'selected-seats-count').textContent).toBe('Selected seats: 0');

    seat(el, 7, 12).click();
    seat(el, 7, 11).click();
    couch(el, 1).click();
    await settle();
    expect(seat(el, 7, 12).dataset['state']).toBe('selected');
    expect(one(el, 'selected-seats-count').textContent).toBe('Selected seats: 4');
    expect(q(el, 'selected-seats-row').map((r) => r.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    seat(el, 7, 12).click();
    await settle();
    expect(seat(el, 7, 12).dataset['state']).toBe('available');

    for (const c of [5 + 2, 9, 11, 13]) seat(el, 8, c).click();
    seat(el, 8, 15).click();
    seat(el, 8, 16).click();
    seat(el, 8, 17).click();
    await settle();
    expect(one(el, 'selected-seats-count').textContent).toBe('Selected seats: 10');
    seat(el, 9, 5).click();
    await settle();
    expect(seat(el, 9, 5).dataset['state']).toBe('available');
    expect(document.querySelectorAll('[data-testid="toast"]').length).toBe(1);
    expect(document.querySelector('[data-testid="toast"]')?.textContent).toBe('Maximum 10 seats per booking');
    couch(el, 1).click();
    await settle();
    expect(one(el, 'selected-seats-count').textContent).toBe('Selected seats: 8');
    couch(el, 3).click();
    await settle();
    expect(couch(el, 3).dataset['state']).toBe('selected');
    expect(TestBed.inject(BookingService).booking()?.seats.length).toBe(10);
  });

  it('seat map: unknown screening redirects home, booking of another screening is replaced', async () => {
    drain();
    const router = TestBed.inject(Router);
    const nav = harness.navigateByUrl('/screenings/99/seats');
    await respond('http://localhost:3000/screenings/99', 'nope', { status: 404, statusText: 'Not Found' });
    await nav;
    await new Promise((r) => setTimeout(r));
    expect(router.url).toBe('/');
    drain();
  });

  it('summary, checkout and confirmation', async () => {
    drain();
    const router = TestBed.inject(Router);
    await harness.navigateByUrl('/screenings/1/summary');
    expect(router.url).toBe('/');
    await harness.navigateByUrl('/confirmation');
    expect(router.url).toBe('/');

    await openSeats();
    expect(one(root(), 'continue-button').hasAttribute('disabled')).toBe(true);
    seat(root(), 1, 11).click();
    seat(root(), 7, 12).click();
    seat(root(), 12, 8).click();
    couch(root(), 3).click();
    await settle();
    one(root(), 'continue-button').click();
    await respond('http://localhost:3000/screenings/1', screening);
    await respond('http://localhost:3000/movies/1', movies[0]);
    await new Promise((r) => setTimeout(r));
    await settle();
    expect(router.url).toBe('/screenings/1/summary');
    expect(q(root(), 'summary-item').length).toBe(4);
    expect(q(root(), 'summary-item-price').map((p) => p.textContent)).toEqual([
      '25.00 PLN',
      '32.00 PLN',
      '39.00 PLN',
      '89.00 PLN',
    ]);
    expect(q(root(), 'summary-item-seat').map((p) => p.textContent)).toEqual(['11', '12', '8', 'Couch 3-4']);
    expect(q(root(), 'summary-item-datetime')[0].textContent).toBe('2026-09-15 16:00');
    expect(one(root(), 'summary-total').textContent).toBe('Total: 185.00 PLN');
    q(root(), 'summary-item-remove-button')[0].click();
    await settle();
    expect(one(root(), 'summary-total').textContent).toBe('Total: 160.00 PLN');

    one(root(), 'confirm-button').click();
    await new Promise((r) => setTimeout(r));
    await settle();
    expect(router.url).toBe('/screenings/1/checkout');
    expect(one(root(), 'pay-button').textContent?.trim()).toBe('Pay 160.00 PLN');
    expect(one(root(), 'first-name-label').textContent?.trim()).toBe('First name *');
    expect(one(root(), 'phone-label').textContent?.trim()).toBe('Phone number');

    const type = async (id: string, value: string) => {
      const input = one(root(), id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      await settle();
    };
    expect(q(root(), 'first-name-error').length).toBe(0);
    await type('first-name-input', 'A');
    expect(one(root(), 'first-name-error').textContent).toBe('First name must be at least 2 characters');
    await type('first-name-input', '');
    expect(one(root(), 'first-name-error').textContent).toBe('First name is required');
    await type('first-name-input', 'Anna');
    expect(q(root(), 'first-name-error').length).toBe(0);
    await type('email-input', 'a@.com');
    expect(one(root(), 'email-error').textContent).toBe('Enter a valid email address');
    await type('confirm-email-input', 'x');
    expect(one(root(), 'confirm-email-error').textContent).toBe('Email addresses do not match');
    await type('email-input', 'x');
    expect(q(root(), 'confirm-email-error').length).toBe(0);
    await type('email-input', 'anna@example.com');
    expect(one(root(), 'confirm-email-error').textContent).toBe('Email addresses do not match');
    await type('phone-input', '12345678a');
    expect(one(root(), 'phone-error').textContent).toBe('Phone number must be exactly 9 digits');

    one(root(), 'pay-button').click();
    await settle();
    expect(one(root(), 'last-name-error').textContent).toBe('Last name is required');
    expect(one(root(), 'terms-error').textContent).toBe('You must accept the terms and conditions');
    await toastText('The form contains errors');
    http.expectNone('http://localhost:3000/reservations');

    // values survive back / forward
    one(root(), 'checkout-back-button').click();
    await respond('http://localhost:3000/screenings/1', screening);
    await respond('http://localhost:3000/movies/1', movies[0]);
    await new Promise((r) => setTimeout(r));
    await settle();
    expect(router.url).toBe('/screenings/1/summary');
    one(root(), 'confirm-button').click();
    await new Promise((r) => setTimeout(r));
    await settle();
    expect((one(root(), 'first-name-input') as HTMLInputElement).value).toBe('Anna');
    expect(q(root(), 'first-name-error').length).toBe(0);

    await type('last-name-input', 'Kowalska');
    await type('confirm-email-input', 'anna@example.com');
    await type('phone-input', '123456789');
    const terms = one(root(), 'terms-checkbox').querySelector('input')!;
    terms.click();
    await settle();

    one(root(), 'pay-button').click();
    await settle();
    expect(one(root(), 'pay-button').textContent?.trim()).toBe('Processing…');
    expect(one(root(), 'pay-button').hasAttribute('disabled')).toBe(true);
    const req = http.expectOne('http://localhost:3000/reservations');
    expect(req.request.body).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R12C8', 'R15C3', 'R15C4'],
      customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '123456789' },
      totalPrice: 160,
    });
    req.flush('boom', { status: 500, statusText: 'Server Error' });
    await settle();
    expect(router.url).toBe('/screenings/1/checkout');
    expect(one(root(), 'pay-button').hasAttribute('disabled')).toBe(false);
    await toastText('Payment failed. Please try again.');

    one(root(), 'pay-button').click();
    await settle();
    http.expectOne('http://localhost:3000/reservations').flush({ id: 1 }, { status: 201, statusText: 'Created' });
    await new Promise((r) => setTimeout(r));
    await settle();
    expect(router.url).toBe('/confirmation');
    expect(one(root(), 'confirmation-message').textContent).toBe('Your tickets will be sent shortly to anna@example.com');

    one(root(), 'confirmation-continue-button').click();
    await new Promise((r) => setTimeout(r));
    expect(router.url).toBe('/');
    expect(TestBed.inject(BookingService).booking()).toBeNull();
    http.match(() => true);
  });
});
