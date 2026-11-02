import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, NEVER, of, throwError } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApiService } from '../api.service';
import { toIsoDate } from '../seating';
import { MovieList } from './movie-list';

describe('MovieList', () => {
  const day = (offset: number) => {
    const d = new Date();
    return toIsoDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset));
  };
  const movies = [
    { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' },
    { id: 2, title: 'B', genre: 'Comedy', runtimeMinutes: 90, format: 'PL subtitles' },
    { id: 3, title: 'C', genre: 'Action', runtimeMinutes: 100, format: 'PL dubbing' },
  ];
  const screenings = [
    { id: 10, movieId: 1, date: day(0), time: '20:00', occupiedSeats: [] },
    { id: 11, movieId: 1, date: day(0), time: '16:00', occupiedSeats: [] },
    { id: 12, movieId: 3, date: day(2), time: '18:00', occupiedSeats: [] },
  ];

  function setup(date: string | null, api: unknown) {
    const params = new BehaviorSubject(convertToParamMap(date ? { date } : {}));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideNativeDateAdapter(),
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { queryParamMap: params, snapshot: { queryParamMap: params.value } } },
      ],
    });
    const fixture = TestBed.createComponent(MovieList);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
    return { fixture, root, q };
  }

  const okApi = { getMovies: () => of(movies), getScreenings: () => of(screenings) };

  it('shows today by default with sorted screening buttons', () => {
    const { q } = setup(null, okApi);
    const buttons = q('[data-testid=day-button]');
    expect(buttons.length).toBe(5);
    expect(buttons[0].textContent!.trim()).toBe('Today');
    expect(buttons.map((b) => b.dataset['selected'])).toEqual(['true', 'false', 'false', 'false', 'false']);
    expect(q('[data-testid=movie-card]').length).toBe(1);
    expect(q('[data-testid=screening-button]').map((b) => b.textContent!.trim())).toEqual(['16:00', '20:00']);
    expect(q('[data-testid=movie-runtime]')[0].textContent).toBe('128 min');
  });

  it('falls back to today for invalid or past dates', () => {
    for (const bad of ['garbage', day(-1), '2026-02-30']) {
      TestBed.resetTestingModule();
      const { q } = setup(bad, okApi);
      expect(q('[data-testid=day-button]')[0].dataset['selected']).toBe('true');
    }
  });

  it('selects another day, and shows the empty state', () => {
    TestBed.resetTestingModule();
    const { q, root } = setup(day(2), okApi);
    expect(q('[data-testid=day-button]')[2].dataset['selected']).toBe('true');
    expect(q('[data-testid=movie-title]').map((e) => e.textContent)).toEqual(['C']);
    TestBed.resetTestingModule();
    const far = setup(day(30), okApi);
    expect(far.q('[data-testid=day-button]').every((b) => b.dataset['selected'] === 'false')).toBe(true);
    expect(far.root.querySelector('[data-testid=movies-empty]')!.textContent).toContain('No screenings on this day');
    expect(far.q('[data-testid=movie-card]').length).toBe(0);
    expect((far.root.querySelector('[data-testid=date-picker]') as HTMLInputElement).value).not.toBe('');
    expect(root).toBeTruthy();
  });

  it('shows loading, then error with retry', () => {
    const loading = setup(null, { getMovies: () => NEVER, getScreenings: () => NEVER });
    expect(loading.q('[data-testid=movies-loading]').length).toBe(1);
    expect(loading.q('[data-testid=movie-card]').length).toBe(0);

    TestBed.resetTestingModule();
    let fail = true;
    const api = {
      getMovies: () => (fail ? throwError(() => new Error('x')) : of(movies)),
      getScreenings: () => of(screenings),
    };
    const { q, fixture } = setup(null, api);
    expect(q('[data-testid=movies-error]')[0].textContent).toContain('Failed to load movies');
    fail = false;
    q('[data-testid=movies-retry-button]')[0].click();
    fixture.detectChanges();
    expect(q('[data-testid=movie-card]').length).toBe(1);
  });
});
