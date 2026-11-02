import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Api } from '../../core/api';
import { MovieList } from './movie-list';

describe('MovieList', () => {
  afterEach(() => vi.useRealTimers());

  async function render(api: Partial<Api>) {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 8, 15, 10) });
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideNativeDateAdapter(), { provide: Api, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(MovieList);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const q = (el: HTMLElement, id: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('shows day buttons and the movies of today ordered by time', async () => {
    const el = await render({
      movies: () =>
        of([
          { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' as const },
          { id: 2, title: 'B', genre: 'Comedy', runtimeMinutes: 90, format: 'PL subtitles' as const },
        ]),
      screenings: () =>
        of([
          { id: 5, movieId: 1, date: '2026-09-15', time: '18:00', occupiedSeats: [] },
          { id: 4, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: [] },
          { id: 6, movieId: 2, date: '2026-09-16', time: '16:00', occupiedSeats: [] },
        ]),
    });
    expect(q(el, 'day-button').map((b) => b.textContent!.trim())).toEqual([
      'Today',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    expect(q(el, 'day-button')[0].dataset['selected']).toBe('true');
    expect(q(el, 'movie-card').length).toBe(1);
    expect(q(el, 'screening-button').map((b) => b.textContent!.trim())).toEqual(['16:00', '18:00']);
    expect(q(el, 'movie-runtime')[0].textContent).toBe('128 min');
  });

  it('shows the error state', async () => {
    const el = await render({ movies: () => throwError(() => new Error('x')), screenings: () => of([]) });
    expect(q(el, 'movies-error')[0].textContent).toContain('Failed to load movies');
    expect(q(el, 'movies-retry-button').length).toBe(1);
  });
});
