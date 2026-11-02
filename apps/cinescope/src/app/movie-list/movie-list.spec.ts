import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { toIso } from '../seat-utils';
import { MovieList } from './movie-list';

describe('MovieList', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ date: '2000-01-01' })) } },
      ],
    });
  });

  it('shows loading, then today with sorted screenings, then empty and error states', async () => {
    const today = toIso(new Date());
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MovieList);
    const el: HTMLElement = fixture.nativeElement;
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="movies-loading"]')).not.toBeNull();
    http.expectOne('http://localhost:3000/movies').flush([
      { id: 1, title: 'A', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' },
      { id: 2, title: 'B', genre: 'Comedy', runtimeMinutes: 90, format: 'PL subtitles' },
    ]);
    http.expectOne('http://localhost:3000/screenings').flush([
      { id: 5, movieId: 1, date: today, time: '18:00', occupiedSeats: [] },
      { id: 4, movieId: 1, date: today, time: '16:00', occupiedSeats: [] },
    ]);
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="movies-loading"]')).toBeNull();
    expect(el.querySelectorAll('[data-testid="movie-card"]').length).toBe(1);
    expect(el.querySelector('[data-testid="movie-runtime"]')?.textContent).toBe('128 min');
    expect(Array.from(el.querySelectorAll('[data-testid="screening-button"]')).map((b) => b.textContent?.trim())).toEqual(['16:00', '18:00']);
    const days = Array.from(el.querySelectorAll<HTMLElement>('[data-testid="day-button"]'));
    expect(days.length).toBe(5);
    expect(days[0].textContent?.trim()).toBe('Today');
    expect(days[0].dataset['selected']).toBe('true');
    expect(days[1].dataset['selected']).toBe('false');
  });

  it('shows an error with retry', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MovieList);
    const el: HTMLElement = fixture.nativeElement;
    http.expectOne('http://localhost:3000/movies').flush('x', { status: 500, statusText: 'err' });
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="movies-error"]')?.textContent).toContain('Failed to load movies');
    el.querySelector<HTMLElement>('[data-testid="movies-retry-button"]')?.click();
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="movies-loading"]')).not.toBeNull();
    http.match(() => true);
  });
});
