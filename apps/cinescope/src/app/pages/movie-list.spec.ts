import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { appRoutes } from '../app.routes';
import { addDays, toIso, weekdayName } from '../core/dates';

const today = new Date();
const iso = (n: number) => toIso(addDays(today, n));
const movies = [
  { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' },
  { id: 2, title: 'B', genre: 'Sci-Fi', runtimeMinutes: 90, format: 'PL subtitles' },
];
const screenings = [
  { id: 1, movieId: 1, date: iso(0), time: '18:00', occupiedSeats: [] },
  { id: 2, movieId: 1, date: iso(0), time: '16:00', occupiedSeats: [] },
  { id: 3, movieId: 2, date: iso(2), time: '12:00', occupiedSeats: [] },
];

describe('movie list', () => {
  let http!: HttpTestingController;
  let harness!: RouterTestingHarness;
  const root = () => harness.routeNativeElement as HTMLElement;
  const all = (id: string) => Array.from(root().querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
  const flush = async () => {
    await harness.fixture.whenStable();
    harness.detectChanges();
  };

  const respond = async (ok: boolean) => {
    let m: ReturnType<HttpTestingController['match']> = [];
    let s: ReturnType<HttpTestingController['match']> = [];
    await vi.waitFor(() => {
      m = [...m, ...http.match('http://localhost:3000/movies')];
      s = [...s, ...http.match('http://localhost:3000/screenings')];
      expect(m.length).toBe(1);
      expect(s.length).toBe(1);
    });
    if (ok) {
      m[0].flush(movies);
      s[0].flush(screenings);
    } else {
      m[0].flush('x', { status: 500, statusText: 'err' });
    }
    await flush();
  };

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(appRoutes), provideHttpClient(), provideHttpClientTesting(), provideNativeDateAdapter()],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  it('shows loading, then today with sorted times and the day buttons', async () => {
    const nav = harness.navigateByUrl('/');
    await vi.waitFor(() => expect(all('movies-loading').length).toBe(1));
    expect(all('movie-card').length).toBe(0);
    await respond(true);
    await nav;
    expect(all('movies-loading').length).toBe(0);
    expect(all('movie-card').length).toBe(1);
    expect(all('screening-button').map((b) => b.textContent?.trim())).toEqual(['16:00', '18:00']);
    expect(all('screening-button').map((b) => b.dataset['screeningId'])).toEqual(['2', '1']);
    expect(all('movie-runtime')[0].textContent).toBe('128 min');
    const labels = all('day-button').map((b) => b.textContent?.trim());
    expect(labels).toEqual(['Today', ...[1, 2, 3, 4].map((n) => weekdayName(addDays(today, n)))]);
    expect(all('day-button').map((b) => b.dataset['selected'])).toEqual(['true', 'false', 'false', 'false', 'false']);
  });

  it('switches day, shows the empty state, and falls back to today for bad dates', async () => {
    const nav = harness.navigateByUrl(`/?date=${iso(2)}`);
    await respond(true);
    await nav;
    expect(all('movie-card').length).toBe(1);
    expect(all('movie-title')[0].textContent).toBe('B');
    expect(all('day-button')[2].dataset['selected']).toBe('true');

    all('day-button')[1].click();
    await flush();
    expect(all('movies-empty').length).toBe(1);
    expect(all('movie-card').length).toBe(0);

    for (const bad of ['garbage', '2020-01-01', '2026-02-30']) {
      await harness.navigateByUrl(`/?date=${bad}`);
      await flush();
      expect(all('day-button')[0].dataset['selected']).toBe('true');
    }
  });

  it('shows an error with retry', async () => {
    const nav = harness.navigateByUrl('/');
    await respond(false);
    await nav;
    expect(all('movies-error')[0].textContent).toContain('Failed to load movies');
    all('movies-retry-button')[0].click();
    await flush();
    expect(all('movies-loading').length).toBe(1);
    await respond(true);
    expect(all('movie-card').length).toBe(1);
  });
});
