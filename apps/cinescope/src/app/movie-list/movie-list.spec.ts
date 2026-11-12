import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MovieList } from './movie-list';

const movies = [
  { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' },
  { id: 2, title: 'B', genre: 'Sci-Fi', runtimeMinutes: 90, format: 'PL subtitles' },
];
const screening = (id: number, movieId: number, date: string, time: string) => ({
  id,
  movieId,
  date,
  time,
  occupiedSeats: [],
});

describe('MovieList', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 8, 15, 10, 0) }));
  afterEach(() => vi.useRealTimers());

  async function open(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '', component: MovieList }]),
        provideNativeDateAdapter(),
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    const el: HTMLElement = harness.fixture.nativeElement;
    const q = (id: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
    return { http, harness, q };
  }

  it('shows loading, then the selected day', async () => {
    const { http, harness, q } = await open('/');
    harness.detectChanges();
    expect(q('movies-loading').length).toBe(1);
    expect(q('movie-card').length).toBe(0);

    http.expectOne('http://localhost:3000/movies').flush(movies);
    http.expectOne('http://localhost:3000/screenings').flush([
      screening(1, 1, '2026-09-15', '18:00'),
      screening(2, 1, '2026-09-15', '16:00'),
      screening(3, 2, '2026-09-16', '12:00'),
    ]);
    harness.detectChanges();

    expect(q('movies-loading').length).toBe(0);
    expect(q('day-button').map((b) => b.textContent!.trim())).toEqual([
      'Today',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    expect(q('day-button')[0].dataset['selected']).toBe('true');
    expect(q('day-button')[1].dataset['selected']).toBe('false');
    expect(q('movie-card').length).toBe(1);
    expect(q('movie-runtime')[0].textContent).toBe('128 min');
    expect(q('screening-button').map((b) => b.textContent!.trim())).toEqual(['16:00', '18:00']);
    expect(q('screening-button')[0].dataset['screeningId']).toBe('2');

    q('day-button')[1].click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(q('movie-title')[0].textContent).toBe('B');
    expect(q('day-button')[1].dataset['selected']).toBe('true');
  });

  it('shows the empty state for a date from the URL and ignores past dates', async () => {
    const { http, harness, q } = await open('/?date=2026-10-01');
    http.expectOne('http://localhost:3000/movies').flush(movies);
    http.expectOne('http://localhost:3000/screenings').flush([screening(1, 1, '2026-09-15', '18:00')]);
    harness.detectChanges();
    expect(q('movies-empty').length).toBe(1);
    expect(q('movie-card').length).toBe(0);
    expect(q('day-button').every((b) => b.dataset['selected'] === 'false')).toBe(true);

    await harness.navigateByUrl('/?date=2026-09-01');
    harness.detectChanges();
    expect(q('day-button')[0].dataset['selected']).toBe('true');
  });

  it('shows an error with a working retry', async () => {
    const { http, harness, q } = await open('/');
    http.expectOne('http://localhost:3000/movies').flush('x', { status: 500, statusText: 'err' });
    http.match('http://localhost:3000/screenings');
    harness.detectChanges();
    expect(q('movies-error')[0].textContent).toBe('Failed to load movies');
    q('movies-retry-button')[0].click();
    harness.detectChanges();
    expect(q('movies-loading').length).toBe(1);
    http.expectOne('http://localhost:3000/movies').flush(movies);
    http.expectOne('http://localhost:3000/screenings').flush([]);
    harness.detectChanges();
    expect(q('movies-empty').length).toBe(1);
  });
});
