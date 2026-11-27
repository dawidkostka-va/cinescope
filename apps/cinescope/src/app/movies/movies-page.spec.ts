import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { addDays, toIsoDate } from '../dates';
import { MoviesPage } from './movies-page';

describe('MoviesPage', () => {
  const q = (el: HTMLElement, id: string) =>
    Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  async function setup(date?: string) {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNativeDateAdapter()],
    });
    const fixture = TestBed.createComponent(MoviesPage);
    if (date !== undefined) fixture.componentRef.setInput('date', date);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(q(el, 'movies-loading').length).toBe(1);
    expect(q(el, 'movie-card').length).toBe(0);
    const http = TestBed.inject(HttpTestingController);
    return { fixture, el, http };
  }

  const today = toIsoDate(new Date());
  const movies = [
    { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 100, format: 'PL dubbing' },
    { id: 2, title: 'B', genre: 'Sci-Fi', runtimeMinutes: 90, format: 'PL subtitles' },
  ];

  it('lists today screenings ordered by time and selects Today', async () => {
    const { fixture, el, http } = await setup('1999-01-01');
    http.expectOne('http://localhost:3000/movies').flush(movies);
    http.expectOne('http://localhost:3000/screenings').flush([
      { id: 1, movieId: 2, date: today, time: '20:00', occupiedSeats: [] },
      { id: 2, movieId: 2, date: today, time: '16:00', occupiedSeats: [] },
      { id: 3, movieId: 1, date: toIsoDate(addDays(new Date(), 1)), time: '10:00', occupiedSeats: [] },
    ]);
    fixture.detectChanges();
    expect(q(el, 'movie-card').length).toBe(1);
    expect(q(el, 'movie-runtime')[0].textContent).toBe('90 min');
    expect(q(el, 'screening-button').map((b) => b.textContent?.trim())).toEqual(['16:00', '20:00']);
    expect(q(el, 'day-button').length).toBe(5);
    expect(q(el, 'day-button')[0].textContent?.trim()).toBe('Today');
    expect(q(el, 'day-button')[0].dataset['selected']).toBe('true');
    expect(q(el, 'day-button')[1].dataset['selected']).toBe('false');
  });

  it('shows the empty state', async () => {
    const { fixture, el, http } = await setup(toIsoDate(addDays(new Date(), 30)));
    http.expectOne('http://localhost:3000/movies').flush(movies);
    http.expectOne('http://localhost:3000/screenings').flush([]);
    fixture.detectChanges();
    expect(q(el, 'movies-empty')[0].textContent).toBe('No screenings on this day');
    expect(q(el, 'day-button').every((b) => b.dataset['selected'] === 'false')).toBe(true);
  });

  it('shows the error state', async () => {
    const second = await setup();
    second.http.expectOne('http://localhost:3000/movies').flush('x', { status: 500, statusText: 'x' });
    second.http.match('http://localhost:3000/screenings');
    second.fixture.detectChanges();
    expect(q(second.el, 'movies-error')[0].textContent).toBe('Failed to load movies');
    expect(q(second.el, 'movies-retry-button').length).toBe(1);
  });
});
