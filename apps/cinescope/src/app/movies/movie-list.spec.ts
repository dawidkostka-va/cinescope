import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { toIsoDate } from '../core/dates';
import { MovieList } from './movie-list';

describe('MovieList', () => {
  it('shows the selected day and states', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '', component: MovieList }]), provideHttpClient(), provideHttpClientTesting(), provideNativeDateAdapter()],
    });
    const http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create('/?date=1999-01-01');
    const root: HTMLElement = harness.routeNativeElement!;
    const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
    expect(q('[data-testid=movies-loading]').length).toBe(1);

    const today = toIsoDate(new Date());
    http.expectOne('http://localhost:3000/movies').flush([
      { id: 1, title: 'A', genre: 'G', runtimeMinutes: 100, format: 'PL dubbing' },
      { id: 2, title: 'B', genre: 'G', runtimeMinutes: 90, format: 'PL subtitles' },
    ]);
    http.expectOne('http://localhost:3000/screenings').flush([
      { id: 1, movieId: 1, date: today, time: '18:00', occupiedSeats: [] },
      { id: 2, movieId: 1, date: today, time: '10:00', occupiedSeats: [] },
      { id: 3, movieId: 2, date: '2000-01-01', time: '10:00', occupiedSeats: [] },
    ]);
    await harness.fixture.whenStable();

    expect(q('[data-testid=day-button]').length).toBe(5);
    expect(q('[data-testid=day-button]')[0].textContent?.trim()).toBe('Today');
    expect(q('[data-testid=day-button]')[0].dataset['selected']).toBe('true');
    expect(q('[data-testid=movie-card]').length).toBe(1);
    expect(q('[data-testid=screening-button]').map((b) => b.textContent)).toEqual(['10:00', '18:00']);
    expect(q('[data-testid=movie-runtime]')[0].textContent).toBe('100 min');

    const next = q('[data-testid=day-button]')[1];
    next.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe(`/?date=${next.dataset['date']}`);
    expect(q('[data-testid=movies-empty]')[0].textContent).toBe('No screenings on this day');
    expect(q('[data-testid=movie-card]').length).toBe(0);
  });
});
