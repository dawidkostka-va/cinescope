import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { toIso, startOfToday } from '../core/dates';
import { MovieList } from './movie-list';

describe('MovieList', () => {
  const base = 'http://localhost:3000';
  const q = (el: HTMLElement, id: string) => [...el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];

  function setup() {
    TestBed.configureTestingModule({
      imports: [MovieList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideNativeDateAdapter()],
    });
    const fixture = TestBed.createComponent(MovieList);
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
  }

  it('shows loading, then cards with time-ordered screenings for today', async () => {
    const { fixture, http, el } = setup();
    expect(q(el, 'movies-loading').length).toBe(1);
    expect(q(el, 'movie-card').length).toBe(0);
    const today = toIso(startOfToday());
    http.expectOne(`${base}/movies`).flush([
      { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' },
      { id: 2, title: 'B', genre: 'Sci-Fi', runtimeMinutes: 90, format: 'PL subtitles' },
    ]);
    http.expectOne(`${base}/screenings`).flush([
      { id: 5, movieId: 1, date: today, time: '20:00', occupiedSeats: [] },
      { id: 4, movieId: 1, date: today, time: '16:00', occupiedSeats: [] },
      { id: 6, movieId: 2, date: '2020-01-01', time: '10:00', occupiedSeats: [] },
    ]);
    await fixture.whenStable();
    expect(q(el, 'movies-loading').length).toBe(0);
    expect(q(el, 'movie-card').length).toBe(1);
    expect(q(el, 'movie-runtime')[0].textContent!.trim()).toBe('128 min');
    expect(q(el, 'screening-button').map((b) => b.textContent!.trim())).toEqual(['16:00', '20:00']);
    expect(q(el, 'day-button').length).toBe(5);
    expect(q(el, 'day-button')[0].textContent!.trim()).toBe('Today');
    expect(q(el, 'day-button')[0].dataset['selected']).toBe('true');
  });

  it('shows an error with Retry, then the empty state', async () => {
    const { fixture, http, el } = setup();
    http.expectOne(`${base}/movies`).flush('x', { status: 500, statusText: 'err' });
    await fixture.whenStable();
    expect(q(el, 'movies-error')[0].textContent).toContain('Failed to load movies');
    q(el, 'movies-retry-button')[0].click();
    await fixture.whenStable();
    expect(q(el, 'movies-loading').length).toBe(1);
    http.expectOne(`${base}/movies`).flush([]);
    http.match(`${base}/screenings`).filter((r) => !r.cancelled).forEach((r) => r.flush([]));
    await fixture.whenStable();
    expect(q(el, 'movies-empty')[0].textContent).toContain('No screenings on this day');
  });
});
