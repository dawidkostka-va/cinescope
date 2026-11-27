import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking';
import { bookingInProgressGuard, bookingPaidGuard } from './booking-guard';

const seat = { kind: 'seat' as const, row: 2, column: 6, columnEnd: 6 };

/** Runs a guard for the screen `/screenings/:id/...`; returns true or the redirect as a string. */
const runWith = (guard: typeof bookingInProgressGuard, id: string): true | string =>
  TestBed.runInInjectionContext(() => {
    const route = { paramMap: convertToParamMap({ id }) } as unknown as ActivatedRouteSnapshot;
    const result = guard(route, {} as RouterStateSnapshot);
    return result === true ? true : String(result);
  });

describe('bookingPaidGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('lets the customer in when the booking is paid', () => {
    TestBed.inject(BookingService).save({ screeningId: 1, seats: [seat], paidEmail: 'anna@example.com' });
    expect(runWith(bookingPaidGuard, '1')).toBe(true);
  });

  it('redirects to the movie list without a booking', () => {
    expect(runWith(bookingPaidGuard, '1')).toBe('/');
  });

  it('redirects to the movie list when the booking is still in progress', () => {
    TestBed.inject(BookingService).save({ screeningId: 1, seats: [seat] });
    expect(runWith(bookingPaidGuard, '1')).toBe('/');
  });
});

describe('bookingInProgressGuard', () => {
  const run = (id: string): true | string => runWith(bookingInProgressGuard, id);

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('lets the customer in when the booking holds seats for the screening', () => {
    TestBed.inject(BookingService).save({ screeningId: 1, seats: [seat] });
    expect(run('1')).toBe(true);
  });

  it('redirects to the movie list without a booking', () => {
    expect(run('1')).toBe('/');
  });

  it('redirects to the movie list when the booking belongs to another screening', () => {
    TestBed.inject(BookingService).save({ screeningId: 2, seats: [seat] });
    expect(run('1')).toBe('/');
  });

  it('redirects to the movie list when the booking holds no seats', () => {
    TestBed.inject(BookingService).save({ screeningId: 1, seats: [] });
    expect(run('1')).toBe('/');
  });

  it('redirects to the movie list when the booking is already paid', () => {
    TestBed.inject(BookingService).save({ screeningId: 1, seats: [seat], paidEmail: 'anna@example.com' });
    expect(run('1')).toBe('/');
  });
});
