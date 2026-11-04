import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from './app.routes';
import { BookingService } from './core/booking.service';
import { addDays, startOfToday, toIsoDate } from './core/dates';

const SCREENING = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R15C6', 'R1C10'],
};
const MOVIE = {
  id: 1,
  title: 'The Silent Harbor',
  genre: 'Drama',
  runtimeMinutes: 128,
  format: 'PL subtitles',
};

describe('booking flow', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let host: HTMLElement;

  const q = (id: string) => host.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`);
  const one = (id: string) =>
    host.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
  const text = (id: string) => one(id)?.textContent?.trim();
  const seat = (row: number, col: number) =>
    one(`seat`) &&
    host.querySelector<HTMLElement>(
      `[data-testid="seat"][data-row="${row}"][data-column="${col}"]`,
    )!;
  const couch = (row: number, start: number) =>
    host.querySelector<HTMLElement>(
      `[data-testid="couch"][data-row="${row}"][data-column-start="${start}"]`,
    )!;

  async function settle() {
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  async function respond(url: string, body: object) {
    await vi.waitFor(() => http.expectOne(url).flush(body), { timeout: 2000 });
  }

  async function openSeats() {
    const nav = harness.navigateByUrl('/screenings/1/seats');
    await respond('http://localhost:3000/screenings/1', SCREENING);
    await respond('http://localhost:3000/movies/1', MOVIE);
    await nav;
    await settle();
    host = harness.routeNativeElement as HTMLElement;
  }

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        provideNativeDateAdapter(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(BookingService);
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  it('draws the auditorium', async () => {
    await openSeats();
    expect(text('seat-map-title')).toBe('Choose your seats');
    expect(text('seat-map-subtitle')).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(q('seat-row').length).toBe(15);
    expect(q('seat').length + q('couch').length).toBe(308);
    expect(q('seat').length).toBe(296);
    expect(q('couch').length).toBe(12);
    expect(q('aisle').length).toBe(30);
    expect(q('row-label-left').length).toBe(15);
    expect(q('row-label-right').length).toBe(15);
    const row1 = [...host.querySelectorAll('[data-testid="seat"][data-row="1"]')].map((e) =>
      e.textContent!.trim(),
    );
    expect(row1[0]).toBe('5');
    expect(row1.length).toBe(20);
    expect(host.querySelectorAll('[data-testid="seat"][data-row="11"]').length).toBe(24);
    expect(q('aisle')[0].textContent).toBe('');
    expect(seat(1, 12).dataset['state']).toBe('accessible');
    expect(seat(1, 10).dataset['state']).toBe('unavailable');
    expect(seat(3, 7).dataset['state']).toBe('unavailable');
    expect(couch(15, 5).dataset['state']).toBe('unavailable');
    expect(couch(15, 3).textContent!.trim()).toBe('3-4');
    expect(text('legend')!.replace(/\s+/g, ' ')).toBe('Available Selected Unavailable Accessible');
  });

  it('selects, caps and summarises', async () => {
    await openSeats();
    seat(7, 12).click();
    seat(7, 11).click();
    couch(15, 1).click();
    harness.detectChanges();
    expect(text('selected-seats-count')).toBe('Selected seats: 4');
    expect([...q('selected-seats-row')].map((e) => e.textContent)).toEqual([
      'Row 7: 11, 12',
      'Row 15: 1-2',
    ]);
    expect(seat(7, 12).dataset['state']).toBe('selected');
    seat(3, 7).click();
    expect(seat(3, 7).dataset['state']).toBe('unavailable');
    seat(7, 12).click();
    seat(7, 12).click();
    for (const c of [5, 6, 7, 8, 9, 10]) seat(8, c).click();
    harness.detectChanges();
    expect(text('selected-seats-count')).toBe('Selected seats: 10');
    seat(9, 5).click();
    harness.detectChanges();
    expect(seat(9, 5).dataset['state']).toBe('available');
    await new Promise((r) => setTimeout(r, 50));
    expect(document.querySelector('[data-testid="toast"]')?.textContent).toBe(
      'Maximum 10 seats per booking',
    );
    couch(15, 1).click();
    harness.detectChanges();
    expect(text('selected-seats-count')).toBe('Selected seats: 8');

    one('continue-button').click();
    await respond('http://localhost:3000/screenings/1', SCREENING);
    await respond('http://localhost:3000/movies/1', MOVIE);
    await settle();
    await new Promise((r) => setTimeout(r));
    host = harness.routeNativeElement as HTMLElement;
    expect(TestBed.inject(Router).url).toBe('/screenings/1/summary');
    expect(text('summary-title')).toBe('Your tickets');
    expect(q('summary-item').length).toBe(8);
    expect(text('summary-total')).toBe('Total: 256.00 PLN');
    expect(q('summary-item-datetime')[0].textContent!.trim()).toBe('2026-09-15 16:00');
    one('summary-item-remove-button').click();
    harness.detectChanges();
    expect(text('summary-total')).toBe('Total: 224.00 PLN');
  });

  it('guards routes and validates checkout', async () => {
    await harness.navigateByUrl('/screenings/1/checkout');
    expect(TestBed.inject(Router).url).toBe('/');
    await harness.navigateByUrl('/confirmation');
    expect(TestBed.inject(Router).url).toBe('/');
    await harness.navigateByUrl('/nonsense');
    expect(TestBed.inject(Router).url).toBe('/');

    const booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.addItem({ row: 1, start: 10, end: 10 });
    booking.addItem({ row: 15, start: 1, end: 2 });
    const nav = harness.navigateByUrl('/screenings/1/checkout');
    await nav;
    await settle();
    host = harness.routeNativeElement as HTMLElement;
    expect(text('pay-button')).toBe('Pay 114.00 PLN');
    expect(text('first-name-label')).toBe('First name *');
    expect(q('first-name-error').length).toBe(0);

    one('pay-button').click();
    harness.detectChanges();
    expect(text('first-name-error')).toBe('First name is required');
    expect(text('confirm-email-error')).toBe('Confirm email is required');
    expect(text('terms-error')).toBe('You must accept the terms and conditions');
    expect(q('phone-error').length).toBe(0);
    await new Promise((r) => setTimeout(r, 50));
    expect(document.querySelector('[data-testid="toast"]')?.textContent).toBe(
      'The form contains errors',
    );

    const type = (id: string, value: string) => {
      const el = one(id).matches('input')
        ? (one(id) as HTMLInputElement)
        : one(id).querySelector('input')!;
      el.value = value;
      el.dispatchEvent(new Event('input'));
      el.dispatchEvent(new Event('blur'));
      harness.detectChanges();
    };
    type('first-name-input', 'A');
    expect(text('first-name-error')).toBe('First name must be at least 2 characters');
    type('first-name-input', 'Anna');
    expect(q('first-name-error').length).toBe(0);
    type('email-input', 'a@b');
    expect(text('email-error')).toBe('Enter a valid email address');
    type('email-input', 'anna@example.com');
    type('confirm-email-input', 'anna@example.org');
    expect(text('confirm-email-error')).toBe('Email addresses do not match');
    type('email-input', 'anna@example.org');
    expect(q('confirm-email-error').length).toBe(0);
    type('phone-input', '12345678');
    expect(text('phone-error')).toBe('Phone number must be exactly 9 digits');
    type('phone-input', '123456789');
    type('last-name-input', 'Kowalska');
    one('terms-checkbox').querySelector<HTMLInputElement>('input')!.click();
    harness.detectChanges();
    expect(q('terms-error').length).toBe(0);
    expect(JSON.parse(sessionStorage.getItem('cinescope.booking')!).form.firstName).toBe('Anna');

    one('pay-button').click();
    harness.detectChanges();
    expect(text('pay-button')).toBe('Processing…');
    expect((one('pay-button') as HTMLButtonElement).disabled).toBe(true);
    const req = http.expectOne('http://localhost:3000/reservations');
    expect(req.request.body).toEqual({
      screeningId: 1,
      seats: ['R1C10', 'R15C1', 'R15C2'],
      customer: {
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna@example.org',
        phone: '123456789',
      },
      totalPrice: 114,
    });
    req.flush('boom', { status: 500, statusText: 'err' });
    harness.detectChanges();
    expect(text('pay-button')).toBe('Pay 114.00 PLN');
    expect(TestBed.inject(Router).url).toBe('/screenings/1/checkout');

    one('pay-button').click();
    http
      .expectOne('http://localhost:3000/reservations')
      .flush({ id: 1 }, { status: 201, statusText: 'Created' });
    await settle();
    await new Promise((r) => setTimeout(r));
    host = harness.routeNativeElement as HTMLElement;
    expect(TestBed.inject(Router).url).toBe('/confirmation');
    expect(text('confirmation-heading')).toBe('Payment successful');
    expect(text('confirmation-message')).toBe(
      'Your tickets will be sent shortly to anna@example.org',
    );
    one('confirmation-continue-button').click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(sessionStorage.getItem('cinescope.booking')).toBeNull();
  });

  it('movie list: days, filtering, states', async () => {
    const today = startOfToday();
    const iso = toIsoDate(today);
    const tomorrow = toIsoDate(addDays(today, 1));
    const nav = harness.navigateByUrl('/');
    await new Promise((r) => setTimeout(r));
    host = harness.routeNativeElement as HTMLElement;
    harness.detectChanges();
    expect(q('movies-loading').length).toBe(1);
    expect(q('movie-card').length).toBe(0);
    http
      .expectOne('http://localhost:3000/movies')
      .flush([MOVIE, { ...MOVIE, id: 2, title: 'Other' }]);
    http.expectOne('http://localhost:3000/screenings').flush([
      { id: 1, movieId: 1, date: iso, time: '18:00', occupiedSeats: [] },
      { id: 2, movieId: 1, date: iso, time: '12:30', occupiedSeats: [] },
      { id: 3, movieId: 2, date: tomorrow, time: '10:00', occupiedSeats: [] },
    ]);
    await nav;
    await settle();
    expect(q('movies-loading').length).toBe(0);
    expect(q('day-button').length).toBe(5);
    expect(q('day-button')[0].textContent!.trim()).toBe('Today');
    expect(q('day-button')[0].dataset['selected']).toBe('true');
    expect(q('day-button')[0].dataset['date']).toBe(iso);
    expect(q('movie-card').length).toBe(1);
    expect([...q('screening-button')].map((b) => b.textContent!.trim())).toEqual([
      '12:30',
      '18:00',
    ]);
    expect(text('movie-runtime')).toBe('128 min');

    q('day-button')[1].click();
    await settle();
    expect(TestBed.inject(Router).url).toBe(`/?date=${tomorrow}`);
    expect(q('movie-card').length).toBe(1);
    expect(text('movie-title')).toBe('Other');
    expect(q('day-button')[1].dataset['selected']).toBe('true');

    await harness.navigateByUrl('/?date=2001-01-01');
    harness.detectChanges();
    http.match(() => true).forEach((r) => r.flush([]));
    await settle();
    expect(q('day-button')[0].dataset['selected']).toBe('true');

    const far = toIsoDate(addDays(today, 30));
    await harness.navigateByUrl(`/?date=${far}`);
    http.match(() => true).forEach((r) => r.flush([]));
    await settle();
    expect([...q('day-button')].every((b) => b.dataset['selected'] === 'false')).toBe(true);
    expect(q('movies-empty').length).toBe(1);
    expect((one('date-picker') as HTMLInputElement).value).not.toBe('');
  });
});
