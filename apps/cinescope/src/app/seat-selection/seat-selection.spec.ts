import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BookingService } from '../booking';
import { Movie, Screening } from '../models';
import { SeatSelection } from './seat-selection';

const API = 'http://localhost:3000';

const screening: Screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R15C6'],
};

const movie: Movie = {
  id: 1,
  title: 'The Silent Harbor',
  genre: 'Drama',
  runtimeMinutes: 128,
  format: 'PL dubbing',
};

describe('SeatSelection', () => {
  let fixture: ComponentFixture<SeatSelection>;
  let http: HttpTestingController;

  const el = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
  const seat = (row: number, column: number) =>
    el(`[data-testid="seat"][data-row="${row}"][data-column="${column}"]`);
  const couch = (row: number, start: number) =>
    el(`[data-testid="couch"][data-row="${row}"][data-column-start="${start}"]`);
  const text = (testId: string) => el(`[data-testid="${testId}"]`)?.textContent?.trim();
  const rowLines = () =>
    Array.from(fixture.nativeElement.querySelectorAll('[data-testid="selected-seats-row"]') as NodeListOf<HTMLElement>).map(
      (line) => line.textContent?.trim(),
    );
  const click = (target: HTMLElement) => {
    target.click();
    fixture.detectChanges();
  };

  /** Opens the seat map again, as after a page reload or a return from the summary. */
  async function reopen(): Promise<void> {
    fixture.destroy();
    fixture = TestBed.createComponent(SeatSelection);
    fixture.detectChanges();
    http.expectOne(`${API}/screenings/1`).flush(screening);
    http.expectOne(`${API}/movies/1`).flush(movie);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SeatSelection],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SeatSelection);
    fixture.detectChanges();
    http.expectOne(`${API}/screenings/1`).flush(screening);
    http.expectOne(`${API}/movies/1`).flush(movie);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders occupied seats and couches as unavailable and does not select them', () => {
    expect(seat(3, 7)?.getAttribute('data-state')).toBe('unavailable');
    expect(couch(15, 5)?.getAttribute('data-state')).toBe('unavailable');

    click(seat(3, 7));
    click(couch(15, 5));

    expect(text('selected-seats-count')).toBe('Selected seats: 0');
    expect(rowLines()).toEqual([]);
  });

  it('selects a seat on click and deselects it on the next click', () => {
    click(seat(7, 12));
    expect(seat(7, 12)?.getAttribute('data-state')).toBe('selected');
    expect(text('selected-seats-count')).toBe('Selected seats: 1');
    expect(rowLines()).toEqual(['Row 7: 12']);

    click(seat(7, 12));
    expect(seat(7, 12)?.getAttribute('data-state')).toBe('available');
    expect(text('selected-seats-count')).toBe('Selected seats: 0');
    expect(rowLines()).toEqual([]);
  });

  it('selects a couch as one unit that counts as two seats', () => {
    click(couch(15, 1));
    expect(couch(15, 1)?.getAttribute('data-state')).toBe('selected');
    expect(text('selected-seats-count')).toBe('Selected seats: 2');
    expect(rowLines()).toEqual(['Row 15: 1-2']);

    click(couch(15, 1));
    expect(couch(15, 1)?.getAttribute('data-state')).toBe('available');
    expect(text('selected-seats-count')).toBe('Selected seats: 0');
  });

  it('reports a selected accessible seat as selected and an unselected one as accessible', () => {
    expect(seat(1, 10)?.getAttribute('data-state')).toBe('accessible');
    click(seat(1, 10));
    expect(seat(1, 10)?.getAttribute('data-state')).toBe('selected');
    click(seat(1, 10));
    expect(seat(1, 10)?.getAttribute('data-state')).toBe('accessible');
  });

  it('caps the selection at 10 seats, shows a toast for a click over the cap and still allows deselecting', () => {
    for (let column = 5; column <= 14; column++) {
      click(seat(8, column));
    }
    expect(text('selected-seats-count')).toBe('Selected seats: 10');

    click(seat(8, 15));
    expect(seat(8, 15)?.getAttribute('data-state')).toBe('available');
    expect(text('selected-seats-count')).toBe('Selected seats: 10');
    expect(document.querySelector('[data-testid="toast"]')?.textContent?.trim()).toBe(
      'Maximum 10 seats per booking',
    );

    click(seat(8, 5));
    expect(text('selected-seats-count')).toBe('Selected seats: 9');
    click(seat(8, 15));
    expect(text('selected-seats-count')).toBe('Selected seats: 10');
  });

  it('counts a couch as two when checking the cap', () => {
    for (let column = 5; column <= 13; column++) {
      click(seat(8, column));
    }
    expect(text('selected-seats-count')).toBe('Selected seats: 9');

    click(couch(15, 1));
    expect(text('selected-seats-count')).toBe('Selected seats: 9');
    expect(couch(15, 1)?.getAttribute('data-state')).toBe('available');
  });

  it('lists the selection by row in ascending order, seats in ascending column order', () => {
    click(seat(9, 20));
    click(seat(2, 6));
    click(couch(15, 3));
    click(seat(2, 5));

    expect(text('selected-seats-count')).toBe('Selected seats: 5');
    expect(rowLines()).toEqual(['Row 2: 5, 6', 'Row 9: 20', 'Row 15: 3-4']);
  });

  it('keeps the selection in the booking and shows it again when the seat map is reopened', async () => {
    click(seat(7, 12));
    click(couch(15, 1));

    expect(TestBed.inject(BookingService).current()).toEqual({
      screeningId: 1,
      seats: [
        { kind: 'seat', row: 7, column: 12, columnEnd: 12 },
        { kind: 'couch', row: 15, column: 1, columnEnd: 2 },
      ],
    });

    await reopen();
    expect(seat(7, 12)?.getAttribute('data-state')).toBe('selected');
    expect(couch(15, 1)?.getAttribute('data-state')).toBe('selected');
    expect(text('selected-seats-count')).toBe('Selected seats: 3');
    expect(rowLines()).toEqual(['Row 7: 12', 'Row 15: 1-2']);
  });

  it('discards the booking of another screening once the screening has loaded', async () => {
    TestBed.inject(BookingService).save({
      screeningId: 2,
      seats: [{ kind: 'seat', row: 7, column: 12, columnEnd: 12 }],
    });

    await reopen();
    expect(text('selected-seats-count')).toBe('Selected seats: 0');
    expect(TestBed.inject(BookingService).current()).toEqual({ screeningId: 1, seats: [] });
  });

  it('discards a paid booking of the same screening once the screening has loaded', async () => {
    TestBed.inject(BookingService).save({
      screeningId: 1,
      seats: [{ kind: 'seat', row: 7, column: 12, columnEnd: 12 }],
      paidEmail: 'anna@example.com',
    });

    await reopen();
    expect(text('selected-seats-count')).toBe('Selected seats: 0');
    expect(TestBed.inject(BookingService).current()).toEqual({ screeningId: 1, seats: [] });
  });

  it('Cancel clears the booking and the selection and opens the movie list', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    click(seat(7, 12));

    click(el('[data-testid="cancel-button"]'));

    expect(TestBed.inject(BookingService).current()).toBeNull();
    expect(text('selected-seats-count')).toBe('Selected seats: 0');
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('Continue is disabled without a selection and opens the summary with one', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const continueButton = el('[data-testid="continue-button"]') as HTMLButtonElement;
    expect(continueButton.disabled).toBe(true);

    click(continueButton);
    expect(navigate).not.toHaveBeenCalled();

    click(seat(7, 12));
    expect((el('[data-testid="continue-button"]') as HTMLButtonElement).disabled).toBe(false);
    click(el('[data-testid="continue-button"]'));
    expect(navigate).toHaveBeenCalledWith(['/screenings', 1, 'summary']);
  });

  it('shows the legend with the four states in order', () => {
    const items = Array.from(fixture.nativeElement.querySelectorAll('[data-testid="legend-item"]') as NodeListOf<HTMLElement>);
    expect(items.map((item) => item.textContent?.trim())).toEqual([
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
});
