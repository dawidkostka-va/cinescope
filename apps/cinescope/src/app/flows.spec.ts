import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { appRoutes } from './app.routes';
import { addDays, startOfToday, toIsoDate } from './core/dates';
import { Movie, Screening } from './core/models';

const API = 'http://localhost:3000';
const today = toIsoDate(startOfToday());

const movies: Movie[] = [
  { id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' },
  { id: 2, title: 'Neon Circuit', genre: 'Sci-Fi', runtimeMinutes: 142, format: 'PL subtitles' },
];

const screening: Screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R3C8', 'R3C9', 'R6C12', 'R6C13', 'R11C21', 'R11C22', 'R15C5', 'R15C6'],
};

describe('Cinescope screens', () => {
  let fixture: ComponentFixture<App>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(App);
  });

  afterEach(() => {
    fixture.destroy();
    sessionStorage.clear();
  });

  async function navigate(url: string): Promise<void> {
    await router.navigateByUrl(url);
    settle();
  }

  function settle(): void {
    fixture.detectChanges();
  }

  function all(testId: string): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll(`[data-testid="${testId}"]`));
  }

  function one(testId: string): HTMLElement {
    const [element] = all(testId);
    if (!element) {
      throw new Error(`Missing ${testId}`);
    }
    return element;
  }

  function text(testId: string): string {
    return one(testId).textContent?.trim() ?? '';
  }

  function seatEl(row: number, column: number): HTMLElement {
    const element = all('seat').find((el) => el.dataset['row'] === `${row}` && el.dataset['column'] === `${column}`);
    if (!element) {
      throw new Error(`No seat R${row}C${column}`);
    }
    return element;
  }

  function couchEl(row: number, start: number): HTMLElement {
    const element = all('couch').find(
      (el) => el.dataset['row'] === `${row}` && el.dataset['columnStart'] === `${start}`,
    );
    if (!element) {
      throw new Error(`No couch ${start} in row ${row}`);
    }
    return element;
  }

  function input(testId: string, value: string): void {
    const element = one(testId) as HTMLInputElement;
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  function blur(testId: string): void {
    one(testId).dispatchEvent(new Event('blur'));
  }

  function flushSeatPage(): void {
    http.expectOne(`${API}/screenings/1`).flush(screening);
    http.expectOne(`${API}/movies/1`).flush(movies[0]);
    settle();
  }

  function toastText(): string | undefined {
    return document.querySelector('[data-testid="toast"]')?.textContent?.trim();
  }

  describe('movie list', () => {
    it('shows the day picker, loading state and then the movies of the selected day', async () => {
      await navigate(`/?date=${today}`);
      expect(all('day-button').map((b) => b.textContent?.trim())).toHaveLength(5);
      expect(one('day-button').dataset['selected']).toBe('true');
      expect(text('movies-loading')).toBe('Loading…');

      http.expectOne(`${API}/movies`).flush(movies);
      http
        .expectOne((req: TestRequest['request']) => req.url === `${API}/screenings` && req.params.get('date') === today)
        .flush([
          { id: 7, movieId: 1, date: today, time: '19:30', occupiedSeats: [] },
          { id: 5, movieId: 1, date: today, time: '15:00', occupiedSeats: [] },
        ]);
      settle();

      expect(all('movie-card')).toHaveLength(1);
      expect(text('movie-title')).toBe('The Silent Harbor');
      expect(text('movie-runtime')).toBe('128 min');
      expect(text('movie-format')).toBe('PL subtitles');
      expect(all('screening-button').map((b) => b.textContent?.trim())).toEqual(['15:00', '19:30']);
    });

    it('shows the error with a retry that reissues the requests', async () => {
      await navigate(`/?date=${today}`);
      http.expectOne(`${API}/movies`).flush('boom', { status: 500, statusText: 'Server Error' });
      settle();

      expect(text('movies-error')).toBe('Failed to load movies');
      one('movies-retry-button').click();
      settle();
      expect(all('movies-loading')).toHaveLength(1);
      http.expectOne(`${API}/movies`).flush(movies);
      http
        .match((req) => req.url === `${API}/screenings`)
        .filter((r) => !r.cancelled)
        .forEach((r) => r.flush([]));
      settle();
      expect(text('movies-empty')).toBe('No screenings on this day');
    });

    it('selects the next day from the day buttons and keeps it in the URL', async () => {
      await navigate('/');
      const tomorrow = toIsoDate(addDays(startOfToday(), 1));
      expect(one('day-button').dataset['selected']).toBe('true');
      http.expectOne(`${API}/movies`).flush(movies);
      http.match((req) => req.url === `${API}/screenings`).forEach((r) => r.flush([]));
      settle();

      all('day-button')[1].click();
      await fixture.whenStable();
      settle();
      expect(router.url).toBe(`/?date=${tomorrow}`);
    });
  });

  describe('seat selection', () => {
    it('draws 308 selectable elements and blocks occupied and over-limit selections', async () => {
      await navigate('/screenings/1/seats');
      flushSeatPage();

      expect(all('seat')).toHaveLength(296);
      expect(all('couch')).toHaveLength(12);
      expect(text('seat-map-subtitle')).toBe('Show Date: Tuesday 15 Sep 16:00');

      seatEl(3, 7).click();
      expect(seatEl(3, 7).dataset['state']).toBe('unavailable');
      expect(text('selected-seats-count')).toBe('Selected seats: 0');

      couchEl(15, 1).click();
      couchEl(15, 3).click();
      couchEl(15, 7).click();
      couchEl(15, 9).click();
      couchEl(15, 11).click();
      settle();
      expect(text('selected-seats-count')).toBe('Selected seats: 10');
      expect(couchEl(15, 1).dataset['state']).toBe('selected');

      seatEl(7, 12).click();
      settle();
      expect(text('selected-seats-count')).toBe('Selected seats: 10');
      expect(toastText()).toBe('Maximum 10 seats per booking');

      couchEl(15, 11).click();
      settle();
      expect(text('selected-seats-count')).toBe('Selected seats: 8');
    });

    it('lists the selection by row and continues to the summary with the total', async () => {
      await navigate('/screenings/1/seats');
      flushSeatPage();

      seatEl(7, 12).click();
      couchEl(15, 1).click();
      settle();
      expect(all('selected-seats-row').map((row) => row.textContent?.trim())).toEqual([
        'Row 7: 12',
        'Row 15: 1-2',
      ]);

      one('continue-button').click();
      await fixture.whenStable();
      settle();
      expect(router.url).toBe('/screenings/1/summary');

      http.expectOne(`${API}/screenings/1`).flush(screening);
      http.expectOne(`${API}/movies/1`).flush(movies[0]);
      settle();

      expect(all('summary-item').map((item) => item.querySelector('[data-testid="summary-item-seat"]')?.textContent)).toEqual([
        '12',
        'Couch 1-2',
      ]);
      expect(text('summary-total')).toBe('Total: 121.00 PLN');
      expect(all('summary-item-datetime')[0].textContent?.trim()).toBe('2026-09-15 16:00');

      all('summary-item-remove-button')[0].click();
      settle();
      expect(text('summary-total')).toBe('Total: 89.00 PLN');
    });
  });

  describe('checkout and confirmation', () => {
    async function openCheckout(): Promise<void> {
      await navigate('/screenings/1/seats');
      flushSeatPage();
      seatEl(7, 12).click();
      couchEl(15, 1).click();
      settle();
      one('continue-button').click();
      await fixture.whenStable();
      settle();
      http.expectOne(`${API}/screenings/1`).flush(screening);
      http.expectOne(`${API}/movies/1`).flush(movies[0]);
      settle();
      one('confirm-button').click();
      await fixture.whenStable();
      settle();
    }

    it('shows validation messages for an invalid form and keeps the values', async () => {
      await openCheckout();
      expect(text('checkout-title')).toBe('Your details');
      expect(text('pay-button')).toBe('Pay 121.00 PLN');

      input('first-name-input', 'A');
      blur('first-name-input');
      blur('email-input');
      settle();
      expect(text('first-name-error')).toBe('First name must be at least 2 characters');
      expect(text('email-error')).toBe('Email is required');
      expect(document.querySelectorAll('[data-testid="phone-error"]')).toHaveLength(0);

      one('pay-button').click();
      settle();
      expect(text('last-name-error')).toBe('Last name is required');
      expect(text('terms-error')).toBe('You must accept the terms and conditions');
      expect(toastText()).toBe('The form contains errors');
      http.expectNone(`${API}/reservations`);
    });

    it('posts the reservation, opens the confirmation and clears the booking on continue', async () => {
      await openCheckout();
      input('first-name-input', 'Anna');
      input('last-name-input', 'Kowalska');
      input('email-input', 'anna.kowalska@example.com');
      input('confirm-email-input', 'anna.kowalska@example.com');
      input('phone-input', '123456789');
      one('terms-checkbox').querySelector('input')?.click();
      settle();

      one('pay-button').click();
      const request = http.expectOne(`${API}/reservations`);
      expect(request.request.body).toEqual({
        screeningId: 1,
        seats: ['R7C12', 'R15C1', 'R15C2'],
        customer: {
          firstName: 'Anna',
          lastName: 'Kowalska',
          email: 'anna.kowalska@example.com',
          phone: '123456789',
        },
        totalPrice: 121,
      });
      request.flush({ id: 1, ...request.request.body }, { status: 201, statusText: 'Created' });
      await fixture.whenStable();
      settle();

      expect(router.url).toBe('/confirmation');
      expect(text('confirmation-heading')).toBe('Payment successful');
      expect(text('confirmation-message')).toBe('Your tickets will be sent shortly to anna.kowalska@example.com');

      one('confirmation-continue-button').click();
      await fixture.whenStable();
      expect(router.url).toBe('/');
      expect(sessionStorage.getItem('cinescope.booking')).toBeNull();
    });

    it('keeps the form and shows a toast when the payment fails', async () => {
      await openCheckout();
      input('first-name-input', 'Anna');
      input('last-name-input', 'Kowalska');
      input('email-input', 'anna@example.com');
      input('confirm-email-input', 'anna@example.com');
      one('terms-checkbox').querySelector('input')?.click();
      settle();

      one('pay-button').click();
      http.expectOne(`${API}/reservations`).flush('nope', { status: 500, statusText: 'Server Error' });
      settle();

      expect(router.url).toBe('/screenings/1/checkout');
      expect((one('first-name-input') as HTMLInputElement).value).toBe('Anna');
      expect(text('pay-button')).toBe('Pay 121.00 PLN');
      expect(toastText()).toBe('Payment failed. Please try again.');
    });
  });

  describe('booking guards', () => {
    it('redirects the summary and checkout to the movie list without a booking', async () => {
      await navigate('/screenings/1/summary');
      expect(router.url).toBe('/');
      await navigate('/screenings/1/checkout');
      expect(router.url).toBe('/');
      await navigate('/confirmation');
      expect(router.url).toBe('/');
    });

    it('redirects unknown URLs to the movie list', async () => {
      await navigate('/nothing/here');
      expect(router.url).toBe('/');
    });
  });
});
