import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from './app.routes';

const STORAGE_KEY = 'cinescope.booking';
const API = 'http://localhost:3000';

const UNPAID = { screeningId: 1, seats: ['R7C12'] };
const PAID = { ...UNPAID, paidEmail: 'anna.kowalska@example.com' };

let harness: RouterTestingHarness;
let httpMock: HttpTestingController;

function setBooking(booking: unknown): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

/** Navigates to a URL and returns where the router ended up. */
async function go(url: string): Promise<string> {
  await harness.navigateByUrl(url);
  await harness.fixture.whenStable();
  // The screens loaded on the way have their own requests; only the routing is under test here.
  httpMock.match((request) => request.url.startsWith(API));
  return TestBed.inject(Router).url;
}

describe('App routes', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('redirects unknown URLs to the movie list', async () => {
    expect(await go('/no-such-page')).toBe('/');
  });

  it('opens the summary and checkout of an unpaid booking of the screening', async () => {
    setBooking(UNPAID);
    expect(await go('/screenings/1/summary')).toBe('/screenings/1/summary');
    expect(await go('/screenings/1/checkout')).toBe('/screenings/1/checkout');
  });

  it('redirects the summary and checkout to the movie list without a booking', async () => {
    expect(await go('/screenings/1/summary')).toBe('/');
    expect(await go('/screenings/1/checkout')).toBe('/');
  });

  it('redirects the summary and checkout for a booking of another screening', async () => {
    setBooking(UNPAID);
    expect(await go('/screenings/2/summary')).toBe('/');
    expect(await go('/screenings/2/checkout')).toBe('/');
  });

  it('redirects the summary and checkout when the booking has no seats', async () => {
    setBooking({ screeningId: 1, seats: [] });
    expect(await go('/screenings/1/summary')).toBe('/');
    expect(await go('/screenings/1/checkout')).toBe('/');
  });

  it('redirects the summary and checkout for a paid booking', async () => {
    setBooking(PAID);
    expect(await go('/screenings/1/summary')).toBe('/');
    expect(await go('/screenings/1/checkout')).toBe('/');
  });

  it('opens the confirmation only for a paid booking', async () => {
    expect(await go('/confirmation')).toBe('/');

    setBooking(UNPAID);
    expect(await go('/confirmation')).toBe('/');

    setBooking(PAID);
    expect(await go('/confirmation')).toBe('/confirmation');
  });

  it('leaves the checkout only by navigation, so the screen does not redirect after paying', async () => {
    setBooking(UNPAID);
    expect(await go('/screenings/1/checkout')).toBe('/screenings/1/checkout');

    // Paying marks the booking paid while the checkout stays open; the guards are not run again.
    setBooking(PAID);
    expect(TestBed.inject(Router).url).toBe('/screenings/1/checkout');
    expect(await go('/confirmation')).toBe('/confirmation');
  });
});
