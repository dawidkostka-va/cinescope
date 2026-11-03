/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BookingService } from './booking.service';
import { Checkout } from './checkout/checkout';
import { toIso, today } from './dates';
import { MovieList } from './movie-list/movie-list';
import { SeatMap } from './seat-map/seat-map';
import { Summary } from './summary/summary';

const screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R1C10'],
};
const movie = { id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' };

function setup<T>(component: Type<T>, params: Record<string, string> = { id: '1' }, prepare?: () => void) {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNativeDateAdapter(),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: convertToParamMap(params), queryParamMap: convertToParamMap({}) },
          queryParamMap: of(convertToParamMap({})),
        },
      },
    ],
  });
  prepare?.();
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return { fixture, http };
}

const all = (f: ComponentFixture<unknown>, id: string) =>
  Array.from((f.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
const one = (f: ComponentFixture<unknown>, id: string) => all(f, id)[0];

describe('SeatMap', () => {
  let fixture: ComponentFixture<SeatMap>;

  beforeEach(async () => {
    const s = setup(SeatMap);
    fixture = s.fixture;
    s.http.expectOne('http://localhost:3000/screenings/1').flush(screening);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  const click = async (el: HTMLElement) => {
    el.click();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const seat = (row: number, column: number) =>
    all(fixture, 'seat').find((e) => e.dataset['row'] === `${row}` && e.dataset['column'] === `${column}`)!;
  const couch = (start: number) => all(fixture, 'couch').find((e) => e.dataset['columnStart'] === `${start}`)!;

  it('draws the auditorium', () => {
    expect(one(fixture, 'seat-map-subtitle').textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(all(fixture, 'seat-row').length).toBe(15);
    expect(all(fixture, 'seat').length + all(fixture, 'couch').length).toBe(308);
    expect(all(fixture, 'couch').length).toBe(12);
    expect(all(fixture, 'aisle').length).toBe(30);
    expect(all(fixture, 'row-label-left').length).toBe(15);
    expect(all(fixture, 'row-label-right').length).toBe(15);
    const rows = all(fixture, 'seat-row');
    expect(rows[0].querySelectorAll('[data-testid="seat"]').length).toBe(20);
    expect(rows[10].querySelectorAll('[data-testid="seat"]').length).toBe(24);
    expect(all(fixture, 'seat').filter((s) => s.dataset['state'] === 'accessible').length).toBe(5);
    expect(seat(1, 10).dataset['state']).toBe('unavailable');
    expect(seat(3, 7).dataset['state']).toBe('unavailable');
    expect(couch(5).dataset['state']).toBe('unavailable');
    expect(all(fixture, 'legend-item').map((e) => e.textContent!.trim())).toEqual([
      'Available',
      'Selected',
      'Unavailable',
      'Accessible',
    ]);
  });

  it('selects, deselects, caps at 10 and lists selected seats', async () => {
    await click(seat(7, 12));
    await click(seat(7, 11));
    await click(couch(1));
    expect(seat(7, 12).dataset['state']).toBe('selected');
    expect(one(fixture, 'selected-seats-count').textContent).toBe('Selected seats: 4');
    expect(all(fixture, 'selected-seats-row').map((e) => e.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    await click(seat(3, 7));
    expect(one(fixture, 'selected-seats-count').textContent).toBe('Selected seats: 4');

    for (const c of [5, 6, 7, 8]) await click(seat(8, c));
    expect(one(fixture, 'selected-seats-count').textContent).toBe('Selected seats: 8');
    await click(couch(3));
    expect(one(fixture, 'selected-seats-count').textContent).toBe('Selected seats: 10');
    await click(seat(9, 9));
    expect(one(fixture, 'selected-seats-count').textContent).toBe('Selected seats: 10');
    expect(document.querySelector('[data-testid="toast"]')?.textContent).toBe('Maximum 10 seats per booking');
    await click(couch(3));
    expect(one(fixture, 'selected-seats-count').textContent).toBe('Selected seats: 8');
    expect(JSON.parse(sessionStorage.getItem('cinescope.booking')!).seats.length).toBe(8);
  });
});

describe('Summary and Checkout', () => {
  it('lists tickets, removes them and sums the total', async () => {
    const s = setup(Summary, { id: '1' }, () => {
      const booking = TestBed.inject(BookingService);
      booking.start(1);
      booking.setSeats(['R7C12', 'R15C1', 'R15C2', 'R1C12']);
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    s.http.expectOne('http://localhost:3000/screenings/1').flush(screening);
    await s.fixture.whenStable();
    s.http.expectOne('http://localhost:3000/movies/1').flush(movie);
    await s.fixture.whenStable();
    s.fixture.detectChanges();

    const items = all(s.fixture, 'summary-item');
    expect(items.length).toBe(3);
    expect(all(s.fixture, 'summary-item-seat').map((e) => e.textContent)).toEqual(['12', '12', 'Couch 1-2']);
    expect(all(s.fixture, 'summary-item-price').map((e) => e.textContent)).toEqual(['25.00 PLN', '32.00 PLN', '89.00 PLN']);
    expect(all(s.fixture, 'summary-item-datetime')[0].textContent).toBe('2026-09-15 16:00');
    expect(one(s.fixture, 'summary-total').textContent).toBe('Total: 146.00 PLN');

    for (const _ of items) {
      one(s.fixture, 'summary-item-remove-button').click();
      s.fixture.detectChanges();
    }
    expect(navigate).toHaveBeenCalledWith(['/screenings', 1, 'seats']);
  });

  describe('checkout', () => {
    let s: ReturnType<typeof setup<Checkout>>;
    const input = (id: string) => one(s.fixture, id) as HTMLInputElement;
    const type = (id: string, value: string) => {
      input(id).value = value;
      input(id).dispatchEvent(new Event('input'));
      input(id).dispatchEvent(new Event('blur'));
      s.fixture.detectChanges();
    };
    const text = (id: string) => one(s.fixture, id)?.textContent?.trim();

    beforeEach(() => {
      s = setup(Checkout, { id: '1' }, () => {
        const booking = TestBed.inject(BookingService);
        booking.start(1);
        booking.setSeats(['R7C12', 'R15C1', 'R15C2']);
      });
    });

    it('shows validation messages after blur and on pay', () => {
      expect(text('pay-button')).toBe('Pay 121.00 PLN');
      expect(text('first-name-label')).toBe('First name *');
      expect(text('phone-label')).toBe('Phone number');
      expect(one(s.fixture, 'first-name-error')).toBeUndefined();
      type('first-name-input', '');
      expect(text('first-name-error')).toBe('First name is required');
      type('first-name-input', 'A');
      expect(text('first-name-error')).toBe('First name must be at least 2 characters');
      type('first-name-input', 'Anna');
      expect(one(s.fixture, 'first-name-error')).toBeUndefined();
      type('email-input', 'a@b');
      expect(text('email-error')).toBe('Enter a valid email address');
      type('confirm-email-input', 'anna@example.com');
      expect(text('confirm-email-error')).toBe('Email addresses do not match');
      type('email-input', 'anna@example.com');
      expect(one(s.fixture, 'confirm-email-error')).toBeUndefined();
      type('phone-input', '12345678');
      expect(text('phone-error')).toBe('Phone number must be exactly 9 digits');

      (one(s.fixture, 'pay-button') as HTMLButtonElement).click();
      s.fixture.detectChanges();
      expect(text('last-name-error')).toBe('Last name is required');
      expect(text('terms-error')).toBe('You must accept the terms and conditions');
      expect(document.querySelector('[data-testid="toast"]')?.textContent).toBe('The form contains errors');
      s.http.expectNone('http://localhost:3000/reservations');
    });

    it('pays, marks the booking paid and keeps values on failure', async () => {
      type('first-name-input', 'Anna');
      type('last-name-input', 'Kowalska');
      type('email-input', 'anna@example.com');
      type('confirm-email-input', 'anna@example.com');
      type('phone-input', '123456789');
      (one(s.fixture, 'terms-checkbox').querySelector('input') as HTMLInputElement).click();
      s.fixture.detectChanges();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

      const pay = one(s.fixture, 'pay-button') as HTMLButtonElement;
      pay.click();
      s.fixture.detectChanges();
      expect(pay.disabled).toBe(true);
      expect(pay.textContent!.trim()).toBe('Processing…');
      const req = s.http.expectOne('http://localhost:3000/reservations');
      expect(req.request.body).toEqual({
        screeningId: 1,
        seats: ['R7C12', 'R15C1', 'R15C2'],
        customer: { firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com', phone: '123456789' },
        totalPrice: 121,
      });
      req.flush('boom', { status: 500, statusText: 'Server Error' });
      s.fixture.detectChanges();
      expect(pay.disabled).toBe(false);
      expect(document.querySelector('[data-testid="toast"]')?.textContent).toBe('Payment failed. Please try again.');
      expect(input('first-name-input').value).toBe('Anna');

      pay.click();
      s.http.expectOne('http://localhost:3000/reservations').flush({ id: 1 });
      expect(TestBed.inject(BookingService).state()?.paid).toBe(true);
      expect(TestBed.inject(BookingService).state()?.email).toBe('anna@example.com');
      expect(navigate).toHaveBeenCalledWith('/confirmation');
    });

    it('restores the saved values without messages', () => {
      type('first-name-input', 'Anna');
      s.fixture.destroy();
      TestBed.resetTestingModule();
      const again = TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        ],
      });
      const f = again.createComponent(Checkout);
      f.detectChanges();
      expect((f.nativeElement as HTMLElement).querySelector<HTMLInputElement>('[data-testid="first-name-input"]')!.value).toBe('Anna');
      expect((f.nativeElement as HTMLElement).querySelector('[data-testid$="-error"]')).toBeNull();
    });
  });
});

describe('MovieList', () => {
  const base = 'http://localhost:3000';
  const iso = toIso(today());

  it('shows loading, error with retry, then the screenings of the day', async () => {
    const s = setup(MovieList, {});
    TestBed.inject(Router);
    expect(one(s.fixture, 'movies-loading').textContent).toBe('Loading…');
    expect(all(s.fixture, 'movie-card').length).toBe(0);
    s.http.expectOne(`${base}/movies`).flush('x', { status: 500, statusText: 'err' });
    await s.fixture.whenStable();
    s.fixture.detectChanges();
    expect(one(s.fixture, 'movies-error').textContent).toBe('Failed to load movies');
    (one(s.fixture, 'movies-retry-button') as HTMLButtonElement).click();
    s.fixture.detectChanges();
    expect(one(s.fixture, 'movies-loading')).toBeDefined();
    s.http.expectOne(`${base}/movies`).flush([movie, { ...movie, id: 2, title: 'Other' }]);
    s.http.match(`${base}/screenings`).find((r) => !r.cancelled)!.flush([
      { id: 5, movieId: 1, date: iso, time: '20:00', occupiedSeats: [] },
      { id: 4, movieId: 1, date: iso, time: '16:00', occupiedSeats: [] },
      { id: 6, movieId: 2, date: '2026-09-15', time: '10:00', occupiedSeats: [] },
    ]);
    await s.fixture.whenStable();
    s.fixture.detectChanges();
    expect(all(s.fixture, 'movie-card').length).toBe(1);
    expect(all(s.fixture, 'screening-button').map((b) => b.textContent!.trim())).toEqual(['16:00', '20:00']);
    expect(one(s.fixture, 'movie-runtime').textContent).toBe('128 min');
    const buttons = all(s.fixture, 'day-button');
    expect(buttons.length).toBe(5);
    expect(buttons[0].textContent!.trim()).toBe('Today');
    expect(buttons[0].dataset['selected']).toBe('true');
    expect(buttons[0].dataset['date']).toBe(iso);
    expect(one(s.fixture, 'movies-empty')).toBeUndefined();
  });
});
