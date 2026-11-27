import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../api.service';
import { bookingGuard, confirmationGuard } from '../booking';
import { Movie, Screening } from '../models';
import { SeatSelection } from '../seat-selection/seat-selection';
import { Confirmation } from './confirmation';

const BOOKING_KEY = 'cinescope.booking';

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
  occupiedSeats: [],
};

@Component({ template: '' })
class Home {}

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class Host {}

function createApi() {
  return {
    getScreening: vi.fn((id: string): Observable<Screening> => {
      return id === '1' ? of(screening) : throwError(() => new Error('404'));
    }),
    getMovie: vi.fn((): Observable<Movie> => of(movie)),
  };
}

function storeBooking(booking: Record<string, unknown>): void {
  sessionStorage.setItem(BOOKING_KEY, JSON.stringify(booking));
}

const PAID = { screeningId: 1, seats: ['R7C12', 'R15C5'], paid: { email: 'anna@example.com' } };

async function settle(fixture: ComponentFixture<Host>): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
}

function query(fixture: ComponentFixture<Host>, testId: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
    `[data-testid="${testId}"]`,
  );
}

function text(el: HTMLElement | null): string | undefined {
  return el?.textContent?.trim();
}

async function open(url: string, api = createApi()): Promise<ComponentFixture<Host>> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', component: Home },
        { path: 'confirmation', component: Confirmation, canActivate: [confirmationGuard] },
        { path: 'screenings/:id/seats', component: SeatSelection },
        { path: 'screenings/:id/summary', component: Home, canActivate: [bookingGuard] },
        { path: 'screenings/:id/checkout', component: Home, canActivate: [bookingGuard] },
      ]),
      { provide: ApiService, useValue: api },
    ],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await TestBed.inject(Router).navigateByUrl(url);
  await settle(fixture);
  return fixture;
}

describe('Confirmation', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows the heading, the message with the paid email and the continue button', async () => {
    storeBooking(PAID);
    const fixture = await open('/confirmation');

    expect(text(query(fixture, 'confirmation-heading'))).toBe('Payment successful');
    expect(text(query(fixture, 'confirmation-message'))).toBe(
      'Your tickets will be sent shortly to anna@example.com',
    );
    expect(text(query(fixture, 'confirmation-continue-button'))).toBe('Continue');
    expect(TestBed.inject(Router).url).toBe('/confirmation');
  });

  it('still shows the confirmation after a reload, since the booking is kept', async () => {
    storeBooking(PAID);
    await open('/confirmation');
    // A reload starts a new application with the same sessionStorage.
    TestBed.resetTestingModule();
    const fixture = await open('/confirmation');

    expect(text(query(fixture, 'confirmation-heading'))).toBe('Payment successful');
  });

  it('redirects to / without a paid booking', async () => {
    const fixture = await open('/confirmation');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(query(fixture, 'confirmation-heading')).toBeNull();
  });

  it('redirects to / when the booking is not paid yet', async () => {
    storeBooking({ screeningId: 1, seats: ['R7C12'] });
    await open('/confirmation');

    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('Continue clears the booking and opens /', async () => {
    storeBooking(PAID);
    const fixture = await open('/confirmation');

    query(fixture, 'confirmation-continue-button')?.click();
    await settle(fixture);

    expect(sessionStorage.getItem(BOOKING_KEY)).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('after Continue the seat map of the same screening has no selected seats', async () => {
    storeBooking(PAID);
    const fixture = await open('/confirmation');

    query(fixture, 'confirmation-continue-button')?.click();
    await settle(fixture);
    await TestBed.inject(Router).navigateByUrl('/screenings/1/seats');
    await settle(fixture);

    expect(TestBed.inject(Router).url).toBe('/screenings/1/seats');
    expect(text(query(fixture, 'selected-seats-count'))).toBe('Selected seats: 0');
  });

  it('a paid booking does not keep the seats when the seat map of its screening opens', async () => {
    storeBooking(PAID);
    const fixture = await open('/screenings/1/seats');

    expect(text(query(fixture, 'selected-seats-count'))).toBe('Selected seats: 0');
    expect(JSON.parse(sessionStorage.getItem(BOOKING_KEY) ?? 'null')).toEqual({
      screeningId: 1,
      seats: [],
    });
  });

  it('a paid booking cannot enter the summary or the checkout', async () => {
    storeBooking(PAID);
    await open('/screenings/1/summary');
    expect(TestBed.inject(Router).url).toBe('/');

    await TestBed.inject(Router).navigateByUrl('/screenings/1/checkout');
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
