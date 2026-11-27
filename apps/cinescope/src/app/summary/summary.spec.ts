import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from '../app.routes';
import { Movie, Screening } from '../models';
import { Summary } from './summary';

const API = 'http://localhost:3000';

const MOVIE: Movie = {
  id: 1,
  title: 'The Silent Harbor',
  genre: 'Drama',
  runtimeMinutes: 128,
  format: 'PL dubbing',
};

const SCREENING: Screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: [],
};

// Stored out of order on purpose: the summary orders the tickets by row and column.
const SEATS = ['R7C12', 'R15C1', 'R15C2', 'R1C10'];

const STORAGE_KEY = 'cinescope.booking';

let harness: RouterTestingHarness;
let httpMock: HttpTestingController;

function elements(testId: string): HTMLElement[] {
  return Array.from(harness.fixture.nativeElement.querySelectorAll(`[data-testid="${testId}"]`));
}

function element(testId: string): HTMLElement | null {
  return harness.fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
}

function textOf(element: HTMLElement | null): string | null {
  return element?.textContent?.trim() ?? null;
}

function itemTexts(testId: string): string[] {
  return elements('summary-item').map((item) => textOf(item.querySelector(`[data-testid="${testId}"]`) as HTMLElement) ?? '');
}

function storedSeats(): string[] {
  return (JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as { seats: string[] }).seats;
}

/** Opens the ticket summary and answers its two requests. */
async function openSummary(): Promise<void> {
  await harness.navigateByUrl('/screenings/1/summary', Summary);
  httpMock.expectOne(`${API}/screenings/1`).flush(SCREENING);
  httpMock.expectOne(`${API}/movies/1`).flush(MOVIE);
  harness.fixture.detectChanges();
}

describe('Summary', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ screeningId: 1, seats: SEATS }),
    );
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
    sessionStorage.clear();
  });

  it('lists each seat and couch in row and column order, with movie, date, time, row, seat and price', async () => {
    await openSummary();

    expect(textOf(element('summary-title'))).toBe('Your tickets');
    expect(elements('summary-item')).toHaveLength(3);
    expect(itemTexts('summary-item-title')).toEqual([
      'The Silent Harbor',
      'The Silent Harbor',
      'The Silent Harbor',
    ]);
    expect(itemTexts('summary-item-datetime')).toEqual([
      '2026-09-15 16:00',
      '2026-09-15 16:00',
      '2026-09-15 16:00',
    ]);
    expect(itemTexts('summary-item-row')).toEqual(['1', '7', '15']);
    expect(itemTexts('summary-item-seat')).toEqual(['10', '12', 'Couch 1-2']);
    expect(itemTexts('summary-item-price')).toEqual(['25.00 PLN', '32.00 PLN', '89.00 PLN']);
    expect(elements('summary-item-remove-button').map((button) => textOf(button))).toEqual([
      'Remove',
      'Remove',
      'Remove',
    ]);
  });

  it('shows the total as the sum of the listed prices', async () => {
    await openSummary();

    expect(textOf(element('summary-total'))).toBe('Total: 146.00 PLN');
  });

  it('Remove takes the item out of the booking and updates the total at once', async () => {
    await openSummary();

    (elements('summary-item-remove-button')[1] as HTMLButtonElement).click();
    harness.fixture.detectChanges();

    expect(elements('summary-item')).toHaveLength(2);
    expect(itemTexts('summary-item-seat')).toEqual(['10', 'Couch 1-2']);
    expect(textOf(element('summary-total'))).toBe('Total: 114.00 PLN');
    expect(storedSeats()).toEqual(['R15C1', 'R15C2', 'R1C10']);
  });

  it('removing the last item opens the seat map', async () => {
    await openSummary();

    for (let i = 0; i < 3; i++) {
      (elements('summary-item-remove-button')[0] as HTMLButtonElement).click();
      harness.fixture.detectChanges();
    }
    await harness.fixture.whenStable();

    expect(storedSeats()).toEqual([]);
    expect(TestBed.inject(Router).url).toBe('/screenings/1/seats');
    // The seat map loads its screening and movie again; they are not part of this test.
    httpMock.expectOne(`${API}/screenings/1`).flush(SCREENING);
    httpMock.expectOne(`${API}/movies/1`).flush(MOVIE);
  });

  it('Back returns to the seat map with the selection intact', async () => {
    await openSummary();

    (element('back-button') as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/screenings/1/seats');

    httpMock.expectOne(`${API}/screenings/1`).flush(SCREENING);
    httpMock.expectOne(`${API}/movies/1`).flush(MOVIE);
    harness.fixture.detectChanges();

    expect(textOf(element('selected-seats-count'))).toBe('Selected seats: 4');
    expect(elements('selected-seats-row').map((line) => textOf(line))).toEqual([
      'Row 1: 10',
      'Row 7: 12',
      'Row 15: 1-2',
    ]);
  });

  it('Confirm opens the checkout of the screening', async () => {
    await openSummary();

    (element('confirm-button') as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/screenings/1/checkout');
  });

  it('redirects to the movie list when the screening or its movie cannot be loaded', async () => {
    await harness.navigateByUrl('/screenings/1/summary');
    httpMock
      .expectOne(`${API}/screenings/1`)
      .flush('', { status: 500, statusText: 'Server Error' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/');
    httpMock.match((request) => request.url.startsWith(API));
  });
});
