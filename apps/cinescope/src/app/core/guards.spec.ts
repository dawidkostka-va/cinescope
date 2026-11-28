import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { BookingService } from './booking.service';
import { paidBookingGuard, unpaidBookingGuard } from './guards';

describe('guards', () => {
  const route = (id: string) => ({ paramMap: convertToParamMap({ id }) }) as ActivatedRouteSnapshot;
  const run = <T>(fn: () => T) => TestBed.runInInjectionContext(fn);

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('requires an unpaid booking with seats for this screening', () => {
    const booking = TestBed.inject(BookingService);
    expect(run(() => unpaidBookingGuard(route('1'), {} as never))).toBeInstanceOf(UrlTree);
    booking.open(1);
    expect(run(() => unpaidBookingGuard(route('1'), {} as never))).toBeInstanceOf(UrlTree);
    booking.addSeats(['R1C5']);
    expect(run(() => unpaidBookingGuard(route('1'), {} as never))).toBe(true);
    expect(run(() => unpaidBookingGuard(route('2'), {} as never))).toBeInstanceOf(UrlTree);
    booking.markPaid('a@b.pl');
    expect(run(() => unpaidBookingGuard(route('1'), {} as never))).toBeInstanceOf(UrlTree);
    expect(run(() => paidBookingGuard(route('1'), {} as never))).toBe(true);
    expect(TestBed.inject(Router)).toBeTruthy();
  });

  it('restores the booking from sessionStorage', () => {
    TestBed.inject(BookingService).open(3);
    TestBed.inject(BookingService).addSeats(['R2C6']);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    expect(TestBed.inject(BookingService).booking()?.seats).toEqual(['R2C6']);
  });
});
