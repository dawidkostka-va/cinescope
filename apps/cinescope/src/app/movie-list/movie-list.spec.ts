import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';
import { appRoutes } from '../app.routes';
import { Movie, Screening } from '../models';
import { MovieList } from './movie-list';

const API = 'http://localhost:3000';

const MOVIES: Movie[] = [
  { id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL dubbing' },
  { id: 2, title: 'Night Tram', genre: 'Thriller', runtimeMinutes: 95, format: 'PL subtitles' },
  { id: 3, title: 'Empty Field', genre: 'Comedy', runtimeMinutes: 100, format: 'PL dubbing' },
];

// Returned out of order on purpose: the screen must order the buttons by time.
const SCREENINGS: Screening[] = [
  { id: 1, movieId: 1, date: '2026-09-15', time: '18:30', occupiedSeats: [] },
  { id: 2, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: [] },
  { id: 3, movieId: 2, date: '2026-09-16', time: '20:00', occupiedSeats: [] },
  { id: 4, movieId: 2, date: '2026-09-15', time: '12:15', occupiedSeats: [] },
  { id: 5, movieId: 3, date: '2026-09-16', time: '14:00', occupiedSeats: [] },
];

let harness: RouterTestingHarness;
let httpMock: HttpTestingController;

function element(testId: string): HTMLElement | null {
  return harness.fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
}

function elements(testId: string): HTMLElement[] {
  return Array.from(harness.fixture.nativeElement.querySelectorAll(`[data-testid="${testId}"]`));
}

function textOf(element: HTMLElement | null): string | null {
  return element?.textContent?.trim() ?? null;
}

/** Opens a URL of the app and returns the movie list rendered there. */
async function open(url: string): Promise<void> {
  await harness.navigateByUrl(url, MovieList);
  await harness.fixture.whenStable();
  harness.fixture.detectChanges();
}

function flushMovies(): void {
  httpMock.expectOne(`${API}/movies`).flush(MOVIES);
  httpMock.expectOne(`${API}/screenings`).flush(SCREENINGS);
  harness.fixture.detectChanges();
}

/** Clicks a day button by its position in the day picker (0 is Today). */
async function clickDay(index: number): Promise<void> {
  (elements('day-button')[index] as HTMLButtonElement).click();
  await harness.fixture.whenStable();
  harness.fixture.detectChanges();
}

describe('Movie list', () => {
  beforeEach(async () => {
    // Tuesday 15 September 2026, the first day of the screenings in db.json.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 15, 10, 0));
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('selects Today by default and offers the next four weekdays, then a datepicker', async () => {
    await open('/');
    flushMovies();

    const buttons = elements('day-button');
    expect(buttons.map((button) => textOf(button))).toEqual([
      'Today',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    expect(buttons.map((button) => button.getAttribute('data-date'))).toEqual([
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
    ]);
    expect(buttons.map((button) => button.getAttribute('data-selected'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
    ]);
    expect(element('day-picker')?.contains(element('date-picker'))).toBe(true);
    expect(element('date-picker')?.tagName).toBe('INPUT');
  });

  it('shows the loading indicator and no cards while the requests are in flight', async () => {
    await open('/');

    expect(textOf(element('movies-loading'))).toBe('Loading…');
    expect(elements('movie-card')).toHaveLength(0);

    flushMovies();
    expect(element('movies-loading')).toBeNull();
  });

  it('shows the error and issues the requests again on Retry', async () => {
    await open('/');
    httpMock.expectOne(`${API}/movies`).flush('', { status: 500, statusText: 'Server Error' });
    // forkJoin cancels the screenings request once the movies request has failed.
    httpMock.match(`${API}/screenings`);
    harness.fixture.detectChanges();

    expect(textOf(element('movies-error'))).toBe('Failed to load movies');
    expect(elements('movie-card')).toHaveLength(0);

    (element('movies-retry-button') as HTMLButtonElement).click();
    harness.fixture.detectChanges();
    expect(element('movies-loading')).not.toBeNull();
    expect(element('movies-error')).toBeNull();

    flushMovies();
    expect(elements('movie-card')).toHaveLength(2);
  });

  it('shows one card per movie with a screening on the day, with its details and buttons by time', async () => {
    await open('/');
    flushMovies();

    const cards = elements('movie-card');
    expect(cards.map((card) => card.getAttribute('data-movie-id'))).toEqual(['1', '2']);

    const [silentHarbor, nightTram] = cards;
    expect(textOf(silentHarbor.querySelector('[data-testid="movie-title"]') as HTMLElement)).toBe(
      'The Silent Harbor',
    );
    expect(textOf(silentHarbor.querySelector('[data-testid="movie-genre"]') as HTMLElement)).toBe(
      'Drama',
    );
    expect(textOf(silentHarbor.querySelector('[data-testid="movie-runtime"]') as HTMLElement)).toBe(
      '128 min',
    );
    expect(textOf(silentHarbor.querySelector('[data-testid="movie-format"]') as HTMLElement)).toBe(
      'PL dubbing',
    );

    const silentHarborButtons = Array.from(
      silentHarbor.querySelectorAll('[data-testid="screening-button"]'),
    ) as HTMLElement[];
    expect(silentHarborButtons.map((button) => textOf(button))).toEqual(['16:00', '18:30']);
    expect(silentHarborButtons.map((button) => button.getAttribute('data-screening-id'))).toEqual([
      '2',
      '1',
    ]);

    expect(textOf(nightTram.querySelector('[data-testid="movie-format"]') as HTMLElement)).toBe(
      'PL subtitles',
    );
    expect(
      Array.from(nightTram.querySelectorAll('[data-testid="screening-button"]')).map((button) =>
        textOf(button as HTMLElement),
      ),
    ).toEqual(['12:15']);
  });

  it('shows only the movies and screenings of the day chosen with the day buttons', async () => {
    await open('/');
    flushMovies();

    await clickDay(1);

    expect(TestBed.inject(Router).url).toBe('/?date=2026-09-16');
    expect(elements('day-button')[1].getAttribute('data-selected')).toBe('true');
    expect(elements('day-button')[0].getAttribute('data-selected')).toBe('false');
    const cards = elements('movie-card');
    expect(cards.map((card) => textOf(card.querySelector('[data-testid="movie-title"]') as HTMLElement))).toEqual([
      'Night Tram',
      'Empty Field',
    ]);
    expect(
      Array.from(cards[0].querySelectorAll('[data-testid="screening-button"]')).map((button) =>
        textOf(button as HTMLElement),
      ),
    ).toEqual(['20:00']);
  });

  it('shows the empty text and no cards for a day without screenings', async () => {
    await open('/?date=2026-09-20');
    flushMovies();

    expect(textOf(element('movies-empty'))).toBe('No screenings on this day');
    expect(elements('movie-card')).toHaveLength(0);
    expect(element('movie-list')?.contains(element('movies-empty'))).toBe(true);
  });

  it('selects the day in the URL, and today for a missing, invalid or past date', async () => {
    await open('/?date=2026-09-17');
    flushMovies();
    expect(selectedDates()).toEqual(['2026-09-17']);

    for (const url of ['/', '/?date=not-a-date', '/?date=2026-02-30', '/?date=2026-09-14']) {
      await open(url);
      expect(selectedDates()).toEqual(['2026-09-15']);
    }
  });

  it('selects a date outside the day buttons from the URL, with no day button selected', async () => {
    await open('/?date=2026-09-22');
    flushMovies();

    expect(selectedDates()).toEqual([]);
    expect(elements('day-button').every((button) => button.getAttribute('data-selected') === 'false')).toBe(true);
    expect((element('date-picker') as HTMLInputElement).value).toContain('2026');
  });

  it('opens the seat map of the screening whose button is clicked', async () => {
    await open('/');
    flushMovies();

    (elements('screening-button')[0] as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/screenings/2/seats');
    // The seat map loads its screening and movie; they are not part of this test.
    httpMock.match((request) => request.url.startsWith(API));
  });
});

/** The dates of the day buttons that are selected. */
function selectedDates(): string[] {
  return elements('day-button')
    .filter((button) => button.getAttribute('data-selected') === 'true')
    .map((button) => button.getAttribute('data-date') ?? '');
}
