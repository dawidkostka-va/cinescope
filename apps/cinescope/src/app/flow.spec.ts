import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from './core/api.service';
import { BookingService } from './core/booking.service';
import { Movie, Screening } from './core/models';
import { Checkout } from './checkout/checkout';
import { MovieList } from './movie-list/movie-list';
import { SeatMap } from './seat-map/seat-map';
import { Summary } from './summary/summary';

const movie: Movie = {
  id: 1,
  title: 'The Silent Harbor',
  genre: 'Drama',
  runtimeMinutes: 128,
  format: 'PL subtitles',
};
const screening: Screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R15C6'],
};
const screenings: Screening[] = [
  screening,
  { ...screening, id: 2, time: '10:00' },
  { ...screening, id: 3, date: '2026-09-16' },
];

function setup(
  api: Partial<ApiService>,
  params: Record<string, string> = {},
  query: Record<string, string> = {},
) {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideNativeDateAdapter(),
      { provide: ApiService, useValue: api },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap(params)),
          queryParamMap: of(convertToParamMap(query)),
        },
      },
    ],
  });
}

const q = (root: HTMLElement, id: string) =>
  root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`);
const text = (root: HTMLElement, id: string) => q(root, id)[0]?.textContent?.trim();

describe('movie list', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 8, 15, 12) }));
  afterEach(() => vi.useRealTimers());

  it('shows the day cards ordered by time', async () => {
    setup({ getMovies: () => of([movie]), getScreenings: () => of(screenings) });
    const fixture = TestBed.createComponent(MovieList);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(q(el, 'movie-card').length).toBe(1);
    expect([...q(el, 'screening-button')].map((b) => b.textContent?.trim())).toEqual([
      '10:00',
      '16:00',
    ]);
    expect([...q(el, 'day-button')].map((b) => b.textContent?.trim())).toEqual([
      'Today',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    expect(q(el, 'day-button')[0].getAttribute('data-selected')).toBe('true');
    expect(text(el, 'movie-runtime')).toBe('128 min');
  });

  it('selects the day from the URL and ignores past dates', async () => {
    setup(
      { getMovies: () => of([movie]), getScreenings: () => of(screenings) },
      {},
      { date: '2026-09-16' },
    );
    let fixture = TestBed.createComponent(MovieList);
    await fixture.whenStable();
    expect(q(fixture.nativeElement, 'screening-button').length).toBe(1);
    expect(q(fixture.nativeElement, 'day-button')[1].getAttribute('data-selected')).toBe('true');
    TestBed.resetTestingModule();
    setup(
      { getMovies: () => of([movie]), getScreenings: () => of(screenings) },
      {},
      { date: '2026-09-01' },
    );
    fixture = TestBed.createComponent(MovieList);
    await fixture.whenStable();
    expect(q(fixture.nativeElement, 'day-button')[0].getAttribute('data-selected')).toBe('true');
  });

  it('shows the empty and error states', async () => {
    setup({ getMovies: () => of([movie]), getScreenings: () => of([]) });
    let fixture = TestBed.createComponent(MovieList);
    await fixture.whenStable();
    expect(text(fixture.nativeElement, 'movies-empty')).toBe('No screenings on this day');
    expect(q(fixture.nativeElement, 'movie-card').length).toBe(0);
    TestBed.resetTestingModule();
    setup({ getMovies: () => throwError(() => new Error('x')), getScreenings: () => of([]) });
    fixture = TestBed.createComponent(MovieList);
    await fixture.whenStable();
    expect(text(fixture.nativeElement, 'movies-error')).toBe('Failed to load movies');
    expect(q(fixture.nativeElement, 'movies-retry-button').length).toBe(1);
  });
});

describe('booking flow', () => {
  const api = {
    getScreening: () => of(screening),
    getMovie: () => of(movie),
    createReservation: vi.fn((r) => of({ ...r, id: 1 })),
  };

  it('selects seats, enforces the limit and lists tickets', async () => {
    setup(api, { id: '1' });
    const fixture = TestBed.createComponent(SeatMap);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(q(el, 'seat').length + q(el, 'couch').length).toBe(308);
    expect(q(el, 'aisle').length).toBe(30);
    expect(text(el, 'seat-map-subtitle')).toBe('Show Date: Tuesday 15 Sep 16:00');

    const click = async (selector: string) => {
      el.querySelector<HTMLElement>(selector)!.click();
      await fixture.whenStable();
    };
    await click('[data-testid=seat][data-row="3"][data-column="7"]');
    expect(text(el, 'selected-seats-count')).toBe('Selected seats: 0');
    await click('[data-testid=seat][data-row="7"][data-column="12"]');
    await click('[data-testid=seat][data-row="7"][data-column="11"]');
    await click('[data-testid=couch][data-row="15"][data-column-start="1"]');
    expect(text(el, 'selected-seats-count')).toBe('Selected seats: 4');
    expect([...q(el, 'selected-seats-row')].map((r) => r.textContent)).toEqual([
      'Row 7: 11, 12',
      'Row 15: 1-2',
    ]);
    expect(
      el.querySelector('[data-testid=couch][data-column-start="5"]')!.getAttribute('data-state'),
    ).toBe('unavailable');
    expect(
      el
        .querySelector('[data-testid=seat][data-row="1"][data-column="10"]')!
        .getAttribute('data-state'),
    ).toBe('accessible');

    for (const c of [5, 6, 7]) await click(`[data-testid=seat][data-row="9"][data-column="${c}"]`);
    await click('[data-testid=seat][data-row="9"][data-column="8"]');
    expect(text(el, 'selected-seats-count')).toBe('Selected seats: 8');
    await click('[data-testid=seat][data-row="9"][data-column="9"]');
    await click('[data-testid=seat][data-row="9"][data-column="10"]');
    expect(text(el, 'selected-seats-count')).toBe('Selected seats: 10');
    await click('[data-testid=seat][data-row="9"][data-column="11"]');
    expect(text(el, 'selected-seats-count')).toBe('Selected seats: 10');
    expect(document.querySelector('[data-testid=toast]')?.textContent?.trim()).toBe(
      'Maximum 10 seats per booking',
    );
    await click('[data-testid=couch][data-row="15"][data-column-start="1"]');
    expect(text(el, 'selected-seats-count')).toBe('Selected seats: 8');

    TestBed.resetTestingModule();
    setup(api, { id: '1' });
    const booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.setSeats(['R15C1', 'R15C2', 'R7C12', 'R1C10']);
    const summary = TestBed.createComponent(Summary);
    await summary.whenStable();
    const s: HTMLElement = summary.nativeElement;
    expect([...q(s, 'summary-item-seat')].map((x) => x.textContent)).toEqual([
      '10',
      '12',
      'Couch 1-2',
    ]);
    expect([...q(s, 'summary-item-price')].map((x) => x.textContent)).toEqual([
      '25.00 PLN',
      '32.00 PLN',
      '89.00 PLN',
    ]);
    expect(text(s, 'summary-total')).toBe('Total: 146.00 PLN');
    expect(text(s, 'summary-item-datetime')).toBe('2026-09-15 16:00');
  });

  it('validates the checkout form and pays', async () => {
    setup(api, { id: '1' });
    const booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.setSeats(['R15C1', 'R15C2', 'R7C12']);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Checkout);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(text(el, 'pay-button')).toBe('Pay 121.00 PLN');
    expect(q(el, 'first-name-error').length).toBe(0);

    el.querySelector<HTMLElement>('[data-testid=pay-button]')!.click();
    await fixture.whenStable();
    expect(text(el, 'first-name-error')).toBe('First name is required');
    expect(text(el, 'confirm-email-error')).toBe('Confirm email is required');
    expect(text(el, 'terms-error')).toBe('You must accept the terms and conditions');
    expect(q(el, 'phone-error').length).toBe(0);
    expect(api.createReservation).not.toHaveBeenCalled();

    const type = async (id: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`[data-testid=${id}]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
    };
    await type('first-name-input', 'Anna');
    await type('last-name-input', 'Kowalska');
    await type('email-input', 'anna@example.com');
    await type('confirm-email-input', 'anna@example.org');
    expect(text(el, 'confirm-email-error')).toBe('Email addresses do not match');
    await type('email-input', 'anna@example.org');
    expect(q(el, 'confirm-email-error').length).toBe(0);
    await type('phone-input', '123');
    expect(text(el, 'phone-error')).toBe('Phone number must be exactly 9 digits');
    await type('phone-input', '123456789');
    el.querySelector<HTMLElement>('[data-testid=terms-checkbox] input')!.click();
    await fixture.whenStable();
    expect(booking.booking()?.form.firstName).toBe('Anna');

    el.querySelector<HTMLElement>('[data-testid=pay-button]')!.click();
    await fixture.whenStable();
    expect(api.createReservation).toHaveBeenCalledWith({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: {
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna@example.org',
        phone: '123456789',
      },
      totalPrice: 121,
    });
    expect(booking.isPaid()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/confirmation');
  });
});
