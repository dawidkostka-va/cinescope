import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { toIsoDate } from '../core/dates';
import { MovieList } from './movie-list';

describe('MovieList', () => {
  const q = (el: HTMLElement, id: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('lists movies with screenings of the selected day, ordered by time', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideNativeDateAdapter()],
    });
    const fixture = TestBed.createComponent(MovieList);
    const el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    expect(q(el, 'movies-loading').length).toBe(1);
    expect(q(el, 'day-button').length).toBe(5);
    expect(q(el, 'day-button')[0].textContent!.trim()).toBe('Today');
    expect(q(el, 'day-button')[0].dataset['selected']).toBe('true');

    const today = toIsoDate(new Date());
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:3000/movies').flush([
      { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' },
      { id: 2, title: 'B', genre: 'Sci-Fi', runtimeMinutes: 90, format: 'PL subtitles' },
    ]);
    http.expectOne('http://localhost:3000/screenings').flush([
      { id: 1, movieId: 1, date: today, time: '18:00', occupiedSeats: [] },
      { id: 2, movieId: 1, date: today, time: '16:00', occupiedSeats: [] },
      { id: 3, movieId: 2, date: '2020-01-01', time: '10:00', occupiedSeats: [] },
    ]);
    fixture.detectChanges();
    expect(q(el, 'movies-loading').length).toBe(0);
    expect(q(el, 'movie-card').length).toBe(1);
    expect(q(el, 'screening-button').map((b) => b.textContent!.trim())).toEqual(['16:00', '18:00']);
    expect(q(el, 'movie-runtime')[0].textContent).toBe('128 min');
  });
});
