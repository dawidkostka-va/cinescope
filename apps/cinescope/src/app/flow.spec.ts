import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { appRoutes } from './app.routes';
import { BookingService } from './booking.service';
import { toIsoDate } from './seat-utils';

const URL = 'http://localhost:3000';
const movies = [
  { id: 1, title: 'One', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' },
  { id: 2, title: 'Two', genre: 'Comedy', runtimeMinutes: 90, format: 'PL dubbing' },
];

function setup() {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter(appRoutes),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNativeDateAdapter(),
    ],
  });
  return { http: TestBed.inject(HttpTestingController), router: TestBed.inject(Router) };
}

describe('movie list and summary', () => {
  it('lists the selected day, handles errors and opens a screening', async () => {
    const { http, router } = setup();
    const today = toIsoDate(new Date());
    const harness = await RouterTestingHarness.create();
    const nav = harness.navigateByUrl('/?date=garbage');
    const movieReq = await vi.waitFor(() => http.expectOne(`${URL}/movies`));
    const screeningReq = http.expectOne(`${URL}/screenings`);
    await nav;
    harness.detectChanges();
    const el: HTMLElement = harness.routeNativeElement!;
    const all = (id: string) =>
      Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
    expect(all('movies-loading').length).toBe(1);
    expect(all('movie-card').length).toBe(0);

    movieReq.flush(movies);
    screeningReq.flush([
      { id: 5, movieId: 2, date: today, time: '18:00', occupiedSeats: [] },
      { id: 4, movieId: 2, date: today, time: '10:30', occupiedSeats: [] },
      { id: 9, movieId: 1, date: '2000-01-01', time: '12:00', occupiedSeats: [] },
    ]);
    harness.detectChanges();
    expect(all('day-button').length).toBe(5);
    expect(all('day-button')[0].textContent!.trim()).toBe('Today');
    expect(all('day-button')[0].dataset['selected']).toBe('true');
    expect(all('day-button')[1].dataset['selected']).toBe('false');
    expect(all('movie-card').length).toBe(1);
    expect(all('movie-title')[0].textContent).toBe('Two');
    expect(all('movie-runtime')[0].textContent).toBe('90 min');
    expect(all('screening-button').map((b) => b.textContent!.trim())).toEqual(['10:30', '18:00']);

    all('day-button')[1].click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toMatch(/^\/\?date=\d{4}-\d{2}-\d{2}$/);
    expect(all('movies-empty')[0].textContent).toBe('No screenings on this day');
    expect(all('movie-card').length).toBe(0);

    all('day-button')[0].click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    all('screening-button')[0].click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/screenings/4/seats');
    http.match(() => true);
  });

  it('shows an error with a working retry', async () => {
    const { http } = setup();
    const harness = await RouterTestingHarness.create();
    const nav = harness.navigateByUrl('/');
    (await vi.waitFor(() => http.expectOne(`${URL}/movies`))).flush('x', {
      status: 500,
      statusText: 'err',
    });
    await nav;
    harness.detectChanges();
    const el: HTMLElement = harness.routeNativeElement!;
    expect(el.querySelector('[data-testid="movies-error"]')!.textContent).toBe(
      'Failed to load movies',
    );
    (el.querySelector('[data-testid="movies-retry-button"]') as HTMLElement).click();
    harness.detectChanges();
    expect(el.querySelector('[data-testid="movies-loading"]')).not.toBeNull();
    expect(http.match(`${URL}/movies`).filter((r) => !r.cancelled).length).toBe(1);
    expect(http.match(`${URL}/screenings`).filter((r) => !r.cancelled).length).toBe(1);
  });

  it('summarises, removes items and returns to the seat map when empty', async () => {
    const { http, router } = setup();
    const booking = TestBed.inject(BookingService);
    booking.startFor(1);
    booking.setSeats(['R7C12', 'R1C10', 'R15C3', 'R15C4']);
    const harness = await RouterTestingHarness.create();
    const nav = harness.navigateByUrl('/screenings/1/summary');
    (await vi.waitFor(() => http.expectOne(`${URL}/screenings/1`))).flush({
      id: 1,
      movieId: 1,
      date: '2026-09-15',
      time: '16:00',
      occupiedSeats: [],
    });
    (await vi.waitFor(() => http.expectOne(`${URL}/movies/1`))).flush(movies[0]);
    await nav;
    harness.detectChanges();
    const el: HTMLElement = harness.routeNativeElement!;
    const all = (id: string) =>
      Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
    expect(all('summary-item').length).toBe(3);
    expect(all('summary-item-seat').map((s) => s.textContent)).toEqual(['10', '12', 'Couch 3-4']);
    expect(all('summary-item-price').map((s) => s.textContent)).toEqual([
      '25.00 PLN',
      '32.00 PLN',
      '89.00 PLN',
    ]);
    expect(all('summary-item-datetime')[0].textContent).toBe('2026-09-15 16:00');
    expect(all('summary-total')[0].textContent).toBe('Total: 146.00 PLN');
    all('summary-item-remove-button')[2].click();
    harness.detectChanges();
    expect(all('summary-total')[0].textContent).toBe('Total: 57.00 PLN');
    all('summary-item-remove-button')[0].click();
    harness.detectChanges();
    all('summary-item-remove-button')[0].click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/screenings/1/seats');
    http.match(() => true);
  });
});
