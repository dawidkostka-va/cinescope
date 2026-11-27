import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../api.service';
import { Movie, Screening } from '../models';
import { MovieList } from '../movie-list/movie-list';
import { SeatSelection } from './seat-selection';

const movie: Movie = {
  id: 1,
  title: 'The Silent Harbor',
  genre: 'Drama',
  runtimeMinutes: 128,
  format: 'PL subtitles',
};

const screening: Screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R15C6'],
};

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class Host {}

@Component({ template: '<p data-testid="summary-stub">summary</p>' })
class SummaryStub {}

function createApi() {
  return {
    getScreening: vi.fn((id: string): Observable<Screening> => {
      return id === '1' ? of(screening) : throwError(() => new Error('404'));
    }),
    getMovie: vi.fn((): Observable<Movie> => of(movie)),
    getMovies: vi.fn((): Observable<Movie[]> => of([movie])),
    getScreeningsByDate: vi.fn((): Observable<Screening[]> => of([])),
  };
}

async function settle(fixture: ComponentFixture<Host>): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
}

function queryAll(fixture: ComponentFixture<Host>, testId: string): HTMLElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      `[data-testid="${testId}"]`,
    ),
  );
}

function query(fixture: ComponentFixture<Host>, testId: string): HTMLElement | null {
  return queryAll(fixture, testId)[0] ?? null;
}

async function open(
  url: string,
  api: ReturnType<typeof createApi>,
): Promise<ComponentFixture<Host>> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideNativeDateAdapter(),
      provideRouter([
        { path: '', component: MovieList },
        { path: 'screenings/:id/seats', component: SeatSelection },
        { path: 'screenings/:id/summary', component: SummaryStub },
      ]),
      { provide: ApiService, useValue: api },
    ],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await TestBed.inject(Router).navigateByUrl(url);
  await settle(fixture);
  return fixture;
}

describe('SeatSelection', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows the title, the show date and the seat limit', async () => {
    const fixture = await open('/screenings/1/seats', createApi());

    expect(query(fixture, 'seat-map-title')?.textContent?.trim()).toBe('Choose your seats');
    expect(query(fixture, 'seat-map-subtitle')?.textContent?.trim()).toBe(
      'Show Date: Tuesday 15 Sep 16:00',
    );
    expect(query(fixture, 'seat-limit-info')?.textContent?.trim()).toBe(
      'You can reserve up to 10 seats per reservation',
    );
    expect(query(fixture, 'screen-indicator')?.textContent?.trim()).toBe('SCREEN');
  });

  it('draws 15 rows with row labels on both edges and two aisles each', async () => {
    const fixture = await open('/screenings/1/seats', createApi());

    const rows = queryAll(fixture, 'seat-row');
    expect(rows.map((row) => row.dataset['row'])).toEqual(
      Array.from({ length: 15 }, (_, i) => String(i + 1)),
    );
    expect(queryAll(fixture, 'row-label-left').map((el) => el.textContent?.trim())).toEqual(
      Array.from({ length: 15 }, (_, i) => String(i + 1)),
    );
    expect(queryAll(fixture, 'row-label-right').map((el) => el.textContent?.trim())).toEqual(
      Array.from({ length: 15 }, (_, i) => String(i + 1)),
    );
    expect(queryAll(fixture, 'aisle').length).toBe(30);
    expect(queryAll(fixture, 'aisle').every((el) => el.textContent === '')).toBe(true);
  });

  it('has 308 selectable elements: 200 seats in rows 1-10, 96 in rows 11-14, 12 couches in row 15', async () => {
    const fixture = await open('/screenings/1/seats', createApi());

    const seats = queryAll(fixture, 'seat');
    const couches = queryAll(fixture, 'couch');
    expect(seats.length + couches.length).toBe(308);
    expect(couches.length).toBe(12);
    expect(seats.filter((seat) => Number(seat.dataset['row']) <= 10).length).toBe(200);
    expect(seats.filter((seat) => Number(seat.dataset['row']) >= 11).length).toBe(96);
  });

  it('numbers columns globally, starting at 5 in rows 1-10, and labels each seat with its column', async () => {
    const fixture = await open('/screenings/1/seats', createApi());

    const columnsOf = (row: number) =>
      queryAll(fixture, 'seat')
        .filter((seat) => Number(seat.dataset['row']) === row)
        .map((seat) => Number(seat.dataset['column']));
    expect(columnsOf(1)).toEqual(Array.from({ length: 20 }, (_, i) => i + 5));
    expect(columnsOf(11)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(columnsOf(15)).toEqual([]);

    const seatsRow11 = queryAll(fixture, 'seat').filter((seat) => seat.dataset['row'] === '11');
    expect(seatsRow11.every((seat) => seat.textContent === seat.dataset['column'])).toBe(true);
  });

  it('places seats of the same column at the same grid position in every row', async () => {
    const fixture = await open('/screenings/1/seats', createApi());

    const position = (row: number, column: number) =>
      queryAll(fixture, 'seat').find(
        (seat) => seat.dataset['row'] === String(row) && seat.dataset['column'] === String(column),
      )?.style.gridColumn;
    expect(position(11, 12)).toBe(position(14, 12));
    expect(position(1, 12)).toBe(position(11, 12));
    expect(position(11, 4)).not.toBe(position(11, 5));
  });

  it('makes row 1 columns 10-15 accessible and the couches of row 15 two columns wide', async () => {
    const fixture = await open('/screenings/1/seats', createApi());

    const accessible = queryAll(fixture, 'seat').filter(
      (seat) => seat.dataset['state'] === 'accessible',
    );
    expect(accessible.map((seat) => seat.dataset['column'])).toEqual([
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
    ]);
    expect(accessible.every((seat) => seat.dataset['row'] === '1')).toBe(true);

    const couches = queryAll(fixture, 'couch');
    expect(couches.map((couch) => couch.textContent?.trim())).toEqual([
      '1-2',
      '3-4',
      '5-6',
      '7-8',
      '9-10',
      '11-12',
      '13-14',
      '15-16',
      '17-18',
      '19-20',
      '21-22',
      '23-24',
    ]);
    expect(couches.every((couch) => couch.dataset['row'] === '15')).toBe(true);
  });

  it('marks occupied seats and couches with a covered identifier as unavailable', async () => {
    const fixture = await open('/screenings/1/seats', createApi());

    const state = (selector: string) => query(fixture, selector)?.dataset['state'];
    const seat = (row: number, column: number) =>
      queryAll(fixture, 'seat').find(
        (el) => el.dataset['row'] === String(row) && el.dataset['column'] === String(column),
      );

    expect(seat(3, 7)?.dataset['state']).toBe('unavailable');
    expect(seat(3, 7)?.hasAttribute('disabled')).toBe(true);
    expect(seat(3, 8)?.dataset['state']).toBe('available');
    expect(seat(1, 10)?.dataset['state']).toBe('accessible');
    expect(state('couch')).toBe('available');

    const couch = queryAll(fixture, 'couch').find((el) => el.dataset['columnStart'] === '5');
    expect(couch?.dataset['state']).toBe('unavailable');
    expect(couch?.dataset['columnEnd']).toBe('6');
    expect(
      queryAll(fixture, 'couch').filter((el) => el.dataset['state'] === 'unavailable').length,
    ).toBe(1);
  });

  describe('selection', () => {
    function seatEl(fixture: ComponentFixture<Host>, row: number, column: number) {
      return queryAll(fixture, 'seat').find(
        (el) => el.dataset['row'] === String(row) && el.dataset['column'] === String(column),
      );
    }

    function couchEl(fixture: ComponentFixture<Host>, start: number) {
      return queryAll(fixture, 'couch').find(
        (el) => el.dataset['row'] === '15' && el.dataset['columnStart'] === String(start),
      );
    }

    function panel(fixture: ComponentFixture<Host>) {
      return {
        count: query(fixture, 'selected-seats-count')?.textContent?.trim(),
        rows: queryAll(fixture, 'selected-seats-row').map((el) => el.textContent?.trim()),
      };
    }

    function toastText(): string | undefined {
      return document.querySelector<HTMLElement>('[data-testid="toast"]')?.textContent?.trim();
    }

    it('selects and deselects a seat on click, and reports it in the panel', async () => {
      const fixture = await open('/screenings/1/seats', createApi());

      seatEl(fixture, 11, 12)?.click();
      await settle(fixture);
      expect(seatEl(fixture, 11, 12)?.dataset['state']).toBe('selected');
      expect(panel(fixture)).toEqual({ count: 'Selected seats: 1', rows: ['Row 11: 12'] });

      seatEl(fixture, 11, 12)?.click();
      await settle(fixture);
      expect(seatEl(fixture, 11, 12)?.dataset['state']).toBe('available');
      expect(panel(fixture)).toEqual({ count: 'Selected seats: 0', rows: [] });
    });

    it('ignores clicks on unavailable seats and couches', async () => {
      const fixture = await open('/screenings/1/seats', createApi());

      seatEl(fixture, 3, 7)?.click();
      couchEl(fixture, 5)?.click();
      await settle(fixture);
      expect(seatEl(fixture, 3, 7)?.dataset['state']).toBe('unavailable');
      expect(couchEl(fixture, 5)?.dataset['state']).toBe('unavailable');
      expect(panel(fixture)).toEqual({ count: 'Selected seats: 0', rows: [] });
    });

    it('selects a couch as one unit that counts as two seats', async () => {
      const fixture = await open('/screenings/1/seats', createApi());

      couchEl(fixture, 1)?.click();
      await settle(fixture);
      expect(couchEl(fixture, 1)?.dataset['state']).toBe('selected');
      expect(panel(fixture)).toEqual({ count: 'Selected seats: 2', rows: ['Row 15: 1-2'] });

      couchEl(fixture, 1)?.click();
      await settle(fixture);
      expect(couchEl(fixture, 1)?.dataset['state']).toBe('available');
      expect(panel(fixture)).toEqual({ count: 'Selected seats: 0', rows: [] });
    });

    it('lists the selection by row in ascending row and column order', async () => {
      const fixture = await open('/screenings/1/seats', createApi());

      seatEl(fixture, 7, 12)?.click();
      couchEl(fixture, 3)?.click();
      seatEl(fixture, 7, 11)?.click();
      seatEl(fixture, 1, 10)?.click();
      await settle(fixture);
      expect(panel(fixture)).toEqual({
        count: 'Selected seats: 5',
        rows: ['Row 1: 10', 'Row 7: 11, 12', 'Row 15: 3-4'],
      });
    });

    it('selects accessible seats and reports them as selected', async () => {
      const fixture = await open('/screenings/1/seats', createApi());

      seatEl(fixture, 1, 10)?.click();
      await settle(fixture);
      expect(seatEl(fixture, 1, 10)?.dataset['state']).toBe('selected');
    });

    it('caps the selection at 10 seats, ignores the click beyond it and shows a toast', async () => {
      const fixture = await open('/screenings/1/seats', createApi());

      for (let column = 1; column <= 10; column++) {
        seatEl(fixture, 11, column)?.click();
      }
      await settle(fixture);
      expect(panel(fixture).count).toBe('Selected seats: 10');
      expect(toastText()).toBeUndefined();

      seatEl(fixture, 11, 11)?.click();
      await settle(fixture);
      expect(seatEl(fixture, 11, 11)?.dataset['state']).toBe('available');
      expect(panel(fixture).count).toBe('Selected seats: 10');
      expect(toastText()).toBe('Maximum 10 seats per booking');
    });

    it('ignores a couch that would exceed the cap, and allows deselecting at the cap', async () => {
      const fixture = await open('/screenings/1/seats', createApi());

      for (let column = 1; column <= 9; column++) {
        seatEl(fixture, 11, column)?.click();
      }
      couchEl(fixture, 1)?.click();
      await settle(fixture);
      expect(couchEl(fixture, 1)?.dataset['state']).toBe('available');
      expect(panel(fixture).count).toBe('Selected seats: 9');
      expect(toastText()).toBe('Maximum 10 seats per booking');

      seatEl(fixture, 11, 1)?.click();
      await settle(fixture);
      expect(seatEl(fixture, 11, 1)?.dataset['state']).toBe('available');
      expect(panel(fixture).count).toBe('Selected seats: 8');
    });

    it('lists the four states in the legend', async () => {
      const fixture = await open('/screenings/1/seats', createApi());

      expect(
        queryAll(fixture, 'legend-item').map((el) => [el.dataset['state'], el.textContent?.trim()]),
      ).toEqual([
        ['available', 'Available'],
        ['selected', 'Selected'],
        ['unavailable', 'Unavailable'],
        ['accessible', 'Accessible'],
      ]);
    });
  });

  describe('booking', () => {
    function seatEl(fixture: ComponentFixture<Host>, row: number, column: number) {
      return queryAll(fixture, 'seat').find(
        (el) => el.dataset['row'] === String(row) && el.dataset['column'] === String(column),
      );
    }

    function storedBooking(): unknown {
      return JSON.parse(sessionStorage.getItem('cinescope.booking') ?? 'null');
    }

    it('stores the selection in sessionStorage and restores it when the seat map reopens', async () => {
      const fixture = await open('/screenings/1/seats', createApi());
      seatEl(fixture, 7, 12)?.click();
      await settle(fixture);
      expect(storedBooking()).toEqual({ screeningId: 1, seats: ['R7C12'] });

      await TestBed.inject(Router).navigateByUrl('/');
      await settle(fixture);
      await TestBed.inject(Router).navigateByUrl('/screenings/1/seats');
      await settle(fixture);
      expect(seatEl(fixture, 7, 12)?.dataset['state']).toBe('selected');
      expect(query(fixture, 'selected-seats-count')?.textContent?.trim()).toBe('Selected seats: 1');
    });

    it('starts an empty booking when the stored one belongs to another screening', async () => {
      sessionStorage.setItem(
        'cinescope.booking',
        JSON.stringify({ screeningId: 2, seats: ['R7C12'] }),
      );
      const fixture = await open('/screenings/1/seats', createApi());

      expect(seatEl(fixture, 7, 12)?.dataset['state']).toBe('available');
      expect(storedBooking()).toEqual({ screeningId: 1, seats: [] });
    });

    it('Cancel clears the booking and opens /', async () => {
      const fixture = await open('/screenings/1/seats', createApi());
      seatEl(fixture, 7, 12)?.click();
      await settle(fixture);

      query(fixture, 'cancel-button')?.click();
      await settle(fixture);
      expect(TestBed.inject(Router).url).toBe('/');
      expect(sessionStorage.getItem('cinescope.booking')).toBeNull();
    });

    it('Continue is disabled without seats and opens the summary with the selection', async () => {
      const fixture = await open('/screenings/1/seats', createApi());
      const continueButton = query(fixture, 'continue-button') as HTMLButtonElement;
      expect(continueButton.disabled).toBe(true);

      seatEl(fixture, 7, 12)?.click();
      await settle(fixture);
      expect(continueButton.disabled).toBe(false);

      continueButton.click();
      await settle(fixture);
      expect(TestBed.inject(Router).url).toBe('/screenings/1/summary');
      expect(storedBooking()).toEqual({ screeningId: 1, seats: ['R7C12'] });
    });
  });

  it('redirects to / when the screening cannot be loaded', async () => {
    const fixture = await open('/screenings/99/seats', createApi());

    expect(TestBed.inject(Router).url).toBe('/');
    expect(query(fixture, 'seat-map-title')).toBeNull();
  });
});
