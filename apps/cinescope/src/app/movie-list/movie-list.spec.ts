import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../api.service';
import { addDays, startOfDay, toIsoDate, weekdayName } from '../dates';
import { Movie, Screening } from '../models';
import { MovieList } from './movie-list';

const today = toIsoDate(startOfDay(new Date()));
const tomorrow = toIsoDate(addDays(startOfDay(new Date()), 1));

const movies: Movie[] = [
  { id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' },
  { id: 2, title: 'Paws & Claws', genre: 'Animation', runtimeMinutes: 96, format: 'PL dubbing' },
  { id: 3, title: 'Sunday Bakers', genre: 'Comedy', runtimeMinutes: 103, format: 'PL dubbing' },
];

const screenings: Screening[] = [
  { id: 1, movieId: 1, date: today, time: '19:30', occupiedSeats: [] },
  { id: 2, movieId: 1, date: today, time: '16:00', occupiedSeats: [] },
  { id: 3, movieId: 2, date: tomorrow, time: '20:00', occupiedSeats: [] },
];

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class Host {}

@Component({ template: '<p data-testid="seat-stub">seats</p>' })
class SeatStub {}

function createApi() {
  return {
    getMovies: vi.fn((): Observable<Movie[]> => of(movies)),
    getScreeningsByDate: vi.fn((date: string): Observable<Screening[]> => of(screenings.filter((s) => s.date === date))),
  };
}

async function settle(fixture: ComponentFixture<Host>): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
}

function query(fixture: ComponentFixture<Host>, testId: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testId}"]`);
}

function queryAll(fixture: ComponentFixture<Host>, testId: string): HTMLElement[] {
  return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`));
}

async function open(url: string, api: ReturnType<typeof createApi>): Promise<ComponentFixture<Host>> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', component: MovieList },
        { path: 'screenings/:id/seats', component: SeatStub },
      ]),
      provideNativeDateAdapter(),
      { provide: ApiService, useValue: api },
    ],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await TestBed.inject(Router).navigateByUrl(url);
  await settle(fixture);
  return fixture;
}

describe('MovieList', () => {
  it('shows today by default with one card per movie with a screening, buttons ordered by time', async () => {
    const fixture = await open('/', createApi());

    const cards = queryAll(fixture, 'movie-card');
    expect(cards.map((card) => card.dataset['movieId'])).toEqual(['1']);
    expect(query(fixture, 'movie-title')?.textContent?.trim()).toBe('The Silent Harbor');
    expect(query(fixture, 'movie-genre')?.textContent?.trim()).toBe('Drama');
    expect(query(fixture, 'movie-runtime')?.textContent?.trim()).toBe('128 min');
    expect(query(fixture, 'movie-format')?.textContent?.trim()).toBe('PL subtitles');

    const buttons = queryAll(fixture, 'screening-button');
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(['16:00', '19:30']);
    expect(buttons.map((button) => button.dataset['screeningId'])).toEqual(['2', '1']);
  });

  it('shows the five day buttons with Today selected by default', async () => {
    const fixture = await open('/', createApi());

    const days = queryAll(fixture, 'day-button');
    expect(days.length).toBe(5);
    expect(days[0].textContent?.trim()).toBe('Today');
    expect(days[0].dataset['selected']).toBe('true');
    expect(days.slice(1).every((day) => day.dataset['selected'] === 'false')).toBe(true);
    expect(days.map((day) => day.dataset['date'])[0]).toBe(today);
    expect(query(fixture, 'date-picker')).not.toBeNull();
  });

  it('labels the next four days with their weekday names', async () => {
    const fixture = await open('/', createApi());

    const days = queryAll(fixture, 'day-button');
    const expected = [1, 2, 3, 4].map((offset) => weekdayName(addDays(startOfDay(new Date()), offset)));
    expect(days.slice(1).map((day) => day.textContent?.trim())).toEqual(expected);
  });

  it('navigates to the chosen day when a day button is clicked', async () => {
    const fixture = await open('/', createApi());

    (queryAll(fixture, 'day-button')[1] as HTMLButtonElement).click();
    await settle(fixture);

    expect(TestBed.inject(Router).url).toBe(`/?date=${toIsoDate(addDays(startOfDay(new Date()), 1))}`);
    expect(queryAll(fixture, 'movie-card').map((card) => card.dataset['movieId'])).toEqual(['2']);
    expect(queryAll(fixture, 'day-button')[1].dataset['selected']).toBe('true');
  });

  it('renders a read-only date picker input', async () => {
    const fixture = await open('/', createApi());

    const input = query(fixture, 'date-picker') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it('opens the seat map of the screening when a screening button is clicked', async () => {
    const fixture = await open('/', createApi());

    (queryAll(fixture, 'screening-button')[0] as HTMLButtonElement).click();
    await settle(fixture);

    expect(TestBed.inject(Router).url).toBe('/screenings/2/seats');
    expect(query(fixture, 'seat-stub')).not.toBeNull();
  });

  it('selects the day from the URL and shows only that day', async () => {
    const fixture = await open(`/?date=${tomorrow}`, createApi());

    const cards = queryAll(fixture, 'movie-card');
    expect(cards.map((card) => card.dataset['movieId'])).toEqual(['2']);
    expect(queryAll(fixture, 'screening-button').map((b) => b.textContent?.trim())).toEqual(['20:00']);
    expect(queryAll(fixture, 'day-button').every((day) => day.dataset['selected'] === 'true')).toBe(false);
  });

  it('selects today for an invalid or past date', async () => {
    const past = toIsoDate(addDays(startOfDay(new Date()), -3));
    for (const url of ['/?date=2026-02-30', '/?date=not-a-date', `/?date=${past}`]) {
      const fixture = await open(url, createApi());
      expect(queryAll(fixture, 'day-button')[0].dataset['selected']).toBe('true');
      expect(queryAll(fixture, 'movie-card').length).toBe(1);
      TestBed.resetTestingModule();
    }
  });

  it('shows the empty message when no movie has a screening on the day', async () => {
    const fixture = await open('/?date=2099-01-01', createApi());

    expect(query(fixture, 'movies-empty')?.textContent?.trim()).toBe('No screenings on this day');
    expect(queryAll(fixture, 'movie-card').length).toBe(0);
  });

  it('shows the loading indicator and no cards while the request is in flight', async () => {
    const api = createApi();
    api.getMovies.mockImplementation(() => new Observable<Movie[]>(() => undefined));
    const fixture = await open('/', api);

    expect(query(fixture, 'movies-loading')?.textContent?.trim()).toBe('Loading…');
    expect(queryAll(fixture, 'movie-card').length).toBe(0);
  });

  it('shows the error with Retry, which re-issues the request', async () => {
    const api = createApi();
    api.getMovies.mockImplementationOnce(() => throwError(() => new Error('network')));
    const fixture = await open('/', api);

    expect(query(fixture, 'movies-error')?.textContent?.trim()).toBe('Failed to load movies');
    expect(queryAll(fixture, 'movie-card').length).toBe(0);

    (query(fixture, 'movies-retry-button') as HTMLButtonElement).click();
    await settle(fixture);

    expect(api.getMovies).toHaveBeenCalledTimes(2);
    expect(query(fixture, 'movies-error')).toBeNull();
    expect(queryAll(fixture, 'movie-card').length).toBe(1);
  });
});
