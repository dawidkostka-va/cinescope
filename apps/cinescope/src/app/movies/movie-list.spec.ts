import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../core/api.service';
import { toIsoDate } from '../core/seating';
import { MovieListComponent } from './movie-list';

describe('MovieListComponent', () => {
  const todayIso = toIsoDate(new Date());
  const movies = [
    { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' },
    { id: 2, title: 'B', genre: 'Sci-Fi', runtimeMinutes: 90, format: 'PL subtitles' },
  ];
  const screenings = [
    { id: 1, movieId: 1, date: todayIso, time: '18:00', occupiedSeats: [] },
    { id: 2, movieId: 1, date: todayIso, time: '16:00', occupiedSeats: [] },
    { id: 3, movieId: 2, date: '2000-01-01', time: '10:00', occupiedSeats: [] },
  ];

  function setup(api: object) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideNativeDateAdapter(), { provide: ApiService, useValue: api }],
    });
    const fixture = TestBed.createComponent(MovieListComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('lists today’s movies with ordered screening buttons', () => {
    const { el } = setup({ movies: () => of(movies), screenings: () => of(screenings) });
    const cards = el.querySelectorAll('[data-testid=movie-card]');
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector('[data-testid=movie-runtime]')?.textContent).toBe('128 min');
    expect(Array.from(cards[0].querySelectorAll('[data-testid=screening-button]')).map((b) => b.textContent?.trim())).toEqual([
      '16:00',
      '18:00',
    ]);
    const days = el.querySelectorAll('[data-testid=day-button]');
    expect(days.length).toBe(5);
    expect(days[0].textContent?.trim()).toBe('Today');
    expect(days[0].getAttribute('data-selected')).toBe('true');
    expect(days[1].getAttribute('data-selected')).toBe('false');
  });

  it('shows the error state with retry', () => {
    const movies$ = vi.fn().mockReturnValueOnce(throwError(() => new Error('x'))).mockReturnValue(of([]));
    const { fixture, el } = setup({ movies: movies$, screenings: () => of([]) });
    expect(el.querySelector('[data-testid=movies-error]')?.textContent).toContain('Failed to load movies');
    (el.querySelector('[data-testid=movies-retry-button]') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid=movies-error]')).toBeNull();
    expect(el.querySelector('[data-testid=movies-empty]')?.textContent).toContain('No screenings on this day');
  });
});
