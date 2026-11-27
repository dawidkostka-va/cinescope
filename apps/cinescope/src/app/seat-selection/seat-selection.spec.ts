import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from '../app.routes';
import { ToastService } from '../toast';
import { Movie, Screening } from '../models';
import { SeatSelection } from './seat-selection';

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
  occupiedSeats: ['R3C7', 'R15C5', 'R15C6'],
};

const STORAGE_KEY = 'cinescope.booking';

let harness: RouterTestingHarness;
let httpMock: HttpTestingController;
let toastShow: (message: string) => void;

function element(selector: string): HTMLElement | null {
  return harness.fixture.nativeElement.querySelector(selector);
}

function elements(selector: string): HTMLElement[] {
  return Array.from(harness.fixture.nativeElement.querySelectorAll(selector));
}

function seat(row: number, column: number): HTMLButtonElement {
  return element(
    `[data-testid="seat"][data-row="${row}"][data-column="${column}"]`,
  ) as HTMLButtonElement;
}

function couch(row: number, start: number): HTMLButtonElement {
  return element(
    `[data-testid="couch"][data-row="${row}"][data-column-start="${start}"]`,
  ) as HTMLButtonElement;
}

function textOf(element: HTMLElement | null): string | null {
  return element?.textContent?.trim() ?? null;
}

function selectedCountText(): string | null {
  return textOf(element('[data-testid="selected-seats-count"]'));
}

function selectedRowTexts(): string[] {
  return elements('[data-testid="selected-seats-row"]').map((line) => textOf(line) ?? '');
}

function storedBooking(): { screeningId: number; seats: string[]; paidEmail?: string } | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function click(target: HTMLElement): void {
  target.click();
  harness.fixture.detectChanges();
}

/** Opens the seat map of a screening and answers its two requests. */
async function openSeatMap(id = 1): Promise<void> {
  await harness.navigateByUrl(`/screenings/${id}/seats`, SeatSelection);
  httpMock.expectOne(`${API}/screenings/${id}`).flush(SCREENING);
  httpMock.expectOne(`${API}/movies/1`).flush(MOVIE);
  harness.fixture.detectChanges();
}

describe('Seat selection', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    toastShow = vi.fn<(message: string) => void>();
    vi.spyOn(TestBed.inject(ToastService), 'show').mockImplementation(toastShow);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('shows the title, the show date and the seat limit text', async () => {
    await openSeatMap();

    expect(textOf(element('[data-testid="seat-map-title"]'))).toBe('Choose your seats');
    expect(textOf(element('[data-testid="seat-map-subtitle"]'))).toBe(
      'Show Date: Tuesday 15 Sep 16:00',
    );
    expect(textOf(element('[data-testid="seat-limit-info"]'))).toBe(
      'You can reserve up to 10 seats per reservation',
    );
    expect(textOf(element('[data-testid="screen-indicator"]'))).toBe('SCREEN');
  });

  it('draws 15 rows with 296 seats, 12 couches and both aisles in every row', async () => {
    await openSeatMap();

    const rows = elements('[data-testid="seat-row"]');
    expect(rows).toHaveLength(15);
    expect(rows.map((row) => row.getAttribute('data-row'))).toEqual(
      Array.from({ length: 15 }, (_, index) => String(index + 1)),
    );
    expect(elements('[data-testid="row-label-left"]').map((label) => textOf(label))).toEqual(
      Array.from({ length: 15 }, (_, index) => String(index + 1)),
    );
    expect(elements('[data-testid="row-label-right"]').map((label) => textOf(label))).toEqual(
      Array.from({ length: 15 }, (_, index) => String(index + 1)),
    );
    expect(elements('[data-testid="seat"]')).toHaveLength(296);
    expect(elements('[data-testid="couch"]')).toHaveLength(12);
    expect(elements('[data-testid="aisle"]')).toHaveLength(30);

    // Rows 1 to 10 start at column 5; rows 11 to 15 start at column 1.
    expect(seat(1, 5)).not.toBeNull();
    expect(seat(1, 4)).toBeNull();
    expect(seat(11, 1)).not.toBeNull();
    expect(seat(11, 24)).not.toBeNull();

    for (const seatElement of elements('[data-testid="seat"]')) {
      expect(textOf(seatElement)).toBe(seatElement.getAttribute('data-column'));
      expect(rows[Number(seatElement.getAttribute('data-row')) - 1].contains(seatElement)).toBe(true);
    }
  });

  it('draws the couches of row 15 as one element each, for columns 1-2 to 23-24', async () => {
    await openSeatMap();

    const couches = elements('[data-testid="couch"]');
    expect(couches.map((element) => element.getAttribute('data-column-start'))).toEqual([
      '1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23',
    ]);
    expect(couches.every((element) => element.getAttribute('data-row') === '15')).toBe(true);
    expect(couches.map((element) => textOf(element))).toEqual([
      '1-2', '3-4', '5-6', '7-8', '9-10', '11-12', '13-14', '15-16', '17-18', '19-20', '21-22', '23-24',
    ]);
    expect(couch(15, 1).getAttribute('data-column-end')).toBe('2');
  });

  it('marks accessible seats in row 1, columns 10 to 15, and nothing else as accessible', async () => {
    await openSeatMap();

    const accessible = elements('[data-testid="seat"][data-state="accessible"]');
    expect(accessible).toHaveLength(6);
    expect(accessible.map((element) => element.getAttribute('data-column'))).toEqual([
      '10', '11', '12', '13', '14', '15',
    ]);
    expect(seat(1, 9).getAttribute('data-state')).toBe('available');
    expect(seat(1, 16).getAttribute('data-state')).toBe('available');
  });

  it('marks occupied seats and couches with an occupied seat as unavailable and disabled', async () => {
    await openSeatMap();

    expect(seat(3, 7).getAttribute('data-state')).toBe('unavailable');
    expect(seat(3, 7).disabled).toBe(true);
    expect(couch(15, 5).getAttribute('data-state')).toBe('unavailable');
    expect(couch(15, 3).getAttribute('data-state')).toBe('available');
  });

  it('selects and deselects a seat, and the panel lists the selection', async () => {
    await openSeatMap();

    click(seat(7, 12));
    expect(seat(7, 12).getAttribute('data-state')).toBe('selected');
    expect(selectedCountText()).toBe('Selected seats: 1');
    expect(selectedRowTexts()).toEqual(['Row 7: 12']);

    click(seat(7, 12));
    expect(seat(7, 12).getAttribute('data-state')).toBe('available');
    expect(selectedCountText()).toBe('Selected seats: 0');
    expect(elements('[data-testid="selected-seats-row"]')).toHaveLength(0);
  });

  it('selects a couch as one unit, counted as two seats', async () => {
    await openSeatMap();

    click(couch(15, 1));
    expect(couch(15, 1).getAttribute('data-state')).toBe('selected');
    expect(selectedCountText()).toBe('Selected seats: 2');
    expect(selectedRowTexts()).toEqual(['Row 15: 1-2']);

    click(couch(15, 1));
    expect(couch(15, 1).getAttribute('data-state')).toBe('available');
  });

  it('ignores clicks on unavailable seats and couches', async () => {
    await openSeatMap();

    click(seat(3, 7));
    click(couch(15, 5));
    expect(selectedCountText()).toBe('Selected seats: 0');
    expect(toastShow).not.toHaveBeenCalled();
  });

  it('lists the selection in rows and columns order, with couches as a range', async () => {
    await openSeatMap();

    click(seat(7, 12));
    click(seat(7, 11));
    click(couch(15, 1));
    expect(selectedCountText()).toBe('Selected seats: 4');
    expect(selectedRowTexts()).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
  });

  it('caps the selection at 10 seats, shows a toast beyond it and allows deselecting at the cap', async () => {
    await openSeatMap();

    for (let column = 5; column <= 14; column++) {
      click(seat(9, column));
    }
    expect(selectedCountText()).toBe('Selected seats: 10');

    click(seat(9, 15));
    expect(toastShow).toHaveBeenCalledWith('Maximum 10 seats per booking');
    expect(selectedCountText()).toBe('Selected seats: 10');
    expect(seat(9, 15).getAttribute('data-state')).toBe('available');

    click(seat(9, 5));
    expect(selectedCountText()).toBe('Selected seats: 9');

    // A couch would take the booking to 11 seats, so it is ignored too.
    click(couch(15, 1));
    expect(toastShow).toHaveBeenCalledTimes(2);
    expect(selectedCountText()).toBe('Selected seats: 9');
    expect(couch(15, 1).getAttribute('data-state')).toBe('available');
  });

  it('shows the selection of the booking in progress when it belongs to this screening', async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ screeningId: 1, seats: ['R7C12', 'R15C1', 'R15C2'] }),
    );
    await openSeatMap();

    expect(seat(7, 12).getAttribute('data-state')).toBe('selected');
    expect(couch(15, 1).getAttribute('data-state')).toBe('selected');
    expect(selectedCountText()).toBe('Selected seats: 3');
    expect(selectedRowTexts()).toEqual(['Row 7: 12', 'Row 15: 1-2']);
  });

  it('starts an empty booking for the screening when the stored one is for another screening', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ screeningId: 2, seats: ['R7C12'] }));
    await openSeatMap();

    expect(selectedCountText()).toBe('Selected seats: 0');
    expect(storedBooking()).toEqual({ screeningId: 1, seats: [] });
  });

  it('starts an empty booking when the stored one is already paid', async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ screeningId: 1, seats: ['R7C12'], paidEmail: 'a@example.com' }),
    );
    await openSeatMap();

    expect(selectedCountText()).toBe('Selected seats: 0');
    expect(storedBooking()).toEqual({ screeningId: 1, seats: [] });
  });

  it('stores the selection in the booking as it changes', async () => {
    await openSeatMap();

    click(seat(7, 12));
    click(couch(15, 1));
    expect(storedBooking()).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
    });
  });

  it('keeps Continue disabled without a selection, and opens the summary with one', async () => {
    await openSeatMap();
    const continueButton = element('[data-testid="continue-button"]') as HTMLButtonElement;
    expect(continueButton.disabled).toBe(true);

    click(seat(7, 12));
    expect(continueButton.disabled).toBe(false);

    const router = TestBed.inject(Router);
    click(continueButton);
    await harness.fixture.whenStable();
    expect(router.url).toBe('/screenings/1/summary');
    // The summary loads its screening and movie; they are not part of this test.
    httpMock.match((request) => request.url.startsWith(API));
  });

  it('Cancel clears the booking and opens the movie list', async () => {
    await openSeatMap();
    click(seat(7, 12));

    click(element('[data-testid="cancel-button"]') as HTMLElement);
    await harness.fixture.whenStable();

    expect(storedBooking()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/');
    // The movie list loads its movies and screenings; they are not part of this test.
    httpMock.match((request) => request.url.startsWith(API));
  });

  it('shows the legend with the four states and their names', async () => {
    await openSeatMap();

    const items = elements('[data-testid="legend-item"]');
    expect(items.map((item) => textOf(item))).toEqual([
      'Available',
      'Selected',
      'Unavailable',
      'Accessible',
    ]);
    expect(items.map((item) => item.getAttribute('data-state'))).toEqual([
      'available',
      'selected',
      'unavailable',
      'accessible',
    ]);
  });

  it('redirects to the movie list when the screening cannot be loaded', async () => {
    await harness.navigateByUrl('/screenings/9/seats');
    httpMock
      .expectOne(`${API}/screenings/9`)
      .flush('', { status: 404, statusText: 'Not Found' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/');
    httpMock.match((request) => request.url.startsWith(API));
  });
});
