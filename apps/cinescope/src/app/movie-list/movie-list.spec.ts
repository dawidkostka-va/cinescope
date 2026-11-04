import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { startOfToday, toIsoDate } from '../dates';
import { Movie, Screening } from '../models';
import { MovieList } from './movie-list';

const API = 'http://localhost:3000';

const movies: Movie[] = [
  {
    id: 1,
    title: 'The Silent Harbor',
    genre: 'Drama',
    runtimeMinutes: 128,
    format: 'PL subtitles',
  },
  { id: 2, title: 'Neon Circuit', genre: 'Sci-Fi', runtimeMinutes: 142, format: 'PL subtitles' },
  { id: 3, title: 'Paws & Claws', genre: 'Animation', runtimeMinutes: 96, format: 'PL dubbing' },
];

const screenings: Screening[] = [
  { id: 2, movieId: 1, date: '', time: '19:30', occupiedSeats: [] },
  { id: 1, movieId: 1, date: '', time: '16:00', occupiedSeats: [] },
  { id: 5, movieId: 2, date: '', time: '15:00', occupiedSeats: [] },
];

describe('MovieList', () => {
  let fixture: ComponentFixture<MovieList>;
  let http: HttpTestingController;
  const today = toIsoDate(startOfToday());

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MovieList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNativeDateAdapter(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MovieList);
  });

  afterEach(() => http.verify());

  function element(testId: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
  }

  function all(testId: string): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll(`[data-testid="${testId}"]`));
  }

  async function flushToday(movieList: Movie[], screeningList: Screening[]): Promise<void> {
    http.expectOne(`${API}/movies`).flush(movieList);
    http
      .expectOne((req) => req.url === `${API}/screenings` && req.params.get('date') === today)
      .flush(screeningList);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows the loading indicator and no cards while requests are in flight', async () => {
    fixture.detectChanges();
    expect(element('movies-loading')?.textContent).toContain('Loading');
    expect(all('movie-card')).toHaveLength(0);
    await flushToday(movies, screenings);
    expect(element('movies-loading')).toBeNull();
  });

  it('renders one card per movie with a screening today, with sorted screening buttons', async () => {
    fixture.detectChanges();
    await flushToday(movies, screenings);

    const cards = all('movie-card');
    expect(cards.map((card) => card.getAttribute('data-movie-id'))).toEqual(['1', '2']);
    expect(cards[0].querySelector('[data-testid="movie-title"]')?.textContent).toContain(
      'The Silent Harbor',
    );
    expect(cards[0].querySelector('[data-testid="movie-runtime"]')?.textContent).toContain(
      '128 min',
    );
    expect(cards[0].querySelector('[data-testid="movie-format"]')?.textContent).toContain(
      'PL subtitles',
    );
    const times = Array.from(cards[0].querySelectorAll('[data-testid="screening-button"]')).map(
      (b) => b.textContent?.trim(),
    );
    expect(times).toEqual(['16:00', '19:30']);
    expect(
      cards[0].querySelector('[data-testid="screening-button"]')?.getAttribute('data-screening-id'),
    ).toBe('1');
  });

  it('shows the empty text when no movie has a screening on the day', async () => {
    fixture.detectChanges();
    await flushToday(movies, []);
    expect(element('movies-empty')?.textContent).toContain('No screenings on this day');
    expect(all('movie-card')).toHaveLength(0);
  });

  it('shows an error with Retry that reissues the requests', async () => {
    fixture.detectChanges();
    http.expectOne((req) => req.url === `${API}/screenings`).flush(screenings);
    http.expectOne(`${API}/movies`).flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element('movies-error')?.textContent).toContain('Failed to load movies');

    element('movies-retry-button')?.click();
    fixture.detectChanges();
    expect(element('movies-loading')).not.toBeNull();
    await flushToday(movies, screenings);
    expect(all('movie-card')).toHaveLength(2);
  });

  it('marks Today as the selected day by default', async () => {
    fixture.detectChanges();
    await flushToday(movies, screenings);
    const days = all('day-button');
    expect(days).toHaveLength(5);
    expect(days[0].getAttribute('data-date')).toBe(today);
    expect(days[0].getAttribute('data-selected')).toBe('true');
    expect(days[0].textContent?.trim()).toBe('Today');
  });
});
