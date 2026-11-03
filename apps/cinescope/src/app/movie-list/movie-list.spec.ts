import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MovieList } from './movie-list';

describe('MovieList', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 15, 10, 0));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '', component: MovieList }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
      ],
    });
  });
  afterEach(() => vi.useRealTimers());

  const movies = [
    { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' },
    { id: 2, title: 'B', genre: 'Comedy', runtimeMinutes: 90, format: 'PL subtitles' },
  ];
  const screenings = [
    { id: 1, movieId: 1, date: '2026-09-15', time: '18:00', occupiedSeats: [] },
    { id: 2, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: [] },
    { id: 3, movieId: 2, date: '2026-09-16', time: '12:00', occupiedSeats: [] },
  ];

  const texts = (el: HTMLElement, id: string) =>
    Array.from(el.querySelectorAll(`[data-testid="${id}"]`)).map((e) => e.textContent?.trim());

  it('shows loading, then today\'s movies with ordered screenings, and filters by day', async () => {
    const harness = await RouterTestingHarness.create('/');
    const el = harness.routeNativeElement as HTMLElement;
    const http = TestBed.inject(HttpTestingController);
    expect(texts(el, 'movies-loading')).toEqual(['Loading…']);
    expect(texts(el, 'movie-card')).toEqual([]);
    http.expectOne('http://localhost:3000/movies').flush(movies);
    http.expectOne('http://localhost:3000/screenings').flush(screenings);
    await harness.fixture.whenStable();

    expect(texts(el, 'day-button')).toEqual(['Today', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    expect(Array.from(el.querySelectorAll('[data-testid=day-button]')).map((b) => b.getAttribute('data-selected'))).toEqual([
      'true', 'false', 'false', 'false', 'false',
    ]);
    expect(texts(el, 'movie-card')).toHaveLength(1);
    expect(texts(el, 'screening-button')).toEqual(['16:00', '18:00']);
    expect(texts(el, 'movie-runtime')).toEqual(['128 min']);

    el.querySelectorAll<HTMLElement>('[data-testid=day-button]')[1].click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/?date=2026-09-16');
    expect(texts(el, 'movie-title')).toEqual(['B']);

    el.querySelectorAll<HTMLElement>('[data-testid=day-button]')[2].click();
    await harness.fixture.whenStable();
    expect(texts(el, 'movies-empty')).toEqual(['No screenings on this day']);
    expect(texts(el, 'movie-card')).toEqual([]);
  });

  it('falls back to today for past or invalid dates and offers retry on error', async () => {
    const harness = await RouterTestingHarness.create('/?date=2026-09-01');
    const el = harness.routeNativeElement as HTMLElement;
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:3000/movies').flush(movies);
    http.expectOne('http://localhost:3000/screenings').flush('x', { status: 500, statusText: 'err' });
    await harness.fixture.whenStable();
    expect(texts(el, 'movies-error')).toEqual(['Failed to load movies']);
    expect(el.querySelector('[data-testid=day-button]')?.getAttribute('data-selected')).toBe('true');
    el.querySelector<HTMLElement>('[data-testid=movies-retry-button]')!.click();
    await harness.fixture.whenStable();
    expect(texts(el, 'movies-loading')).toEqual(['Loading…']);
    http.expectOne('http://localhost:3000/movies').flush(movies);
    http.expectOne('http://localhost:3000/screenings').flush(screenings);
    await harness.fixture.whenStable();
    expect(texts(el, 'movie-card')).toHaveLength(1);
  });
});
