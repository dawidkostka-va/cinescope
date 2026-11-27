import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { MockInstance } from 'vitest';
import { BookedSeat, BookingService } from '../booking';
import { Movie, Screening } from '../models';
import { Summary } from './summary';

const API = 'http://localhost:3000';

const screening: Screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: [],
};

const movie: Movie = {
  id: 1,
  title: 'The Silent Harbor',
  genre: 'Drama',
  runtimeMinutes: 128,
  format: 'PL dubbing',
};

const seat = (row: number, column: number): BookedSeat => ({ kind: 'seat', row, column, columnEnd: column });
const couch = (row: number, column: number): BookedSeat => ({ kind: 'couch', row, column, columnEnd: column + 1 });

describe('Summary', () => {
  let fixture: ComponentFixture<Summary>;
  let http: HttpTestingController;
  let navigate: MockInstance<Router['navigate']>;

  const el = (testId: string): HTMLElement => fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
  const texts = (testId: string): (string | undefined)[] =>
    Array.from(fixture.nativeElement.querySelectorAll(`[data-testid="${testId}"]`) as NodeListOf<HTMLElement>).map(
      (node) => node.textContent?.trim(),
    );
  const click = (target: HTMLElement) => {
    target.click();
    fixture.detectChanges();
  };

  /** Stores the booking, then opens the summary and answers its two requests. */
  async function openSummary(seats: BookedSeat[]): Promise<void> {
    TestBed.inject(BookingService).save({ screeningId: 1, seats });
    fixture = TestBed.createComponent(Summary);
    fixture.detectChanges();
    http.expectOne(`${API}/screenings/1`).flush(screening);
    http.expectOne(`${API}/movies/1`).flush(movie);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Summary],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  it('shows the title and one item per seat and couch, ordered by row and column, with price and total', async () => {
    await openSummary([seat(9, 20), seat(2, 6), couch(15, 3)]);

    expect(el('summary-title').textContent?.trim()).toBe('Your tickets');
    expect(texts('summary-item')).toHaveLength(3);
    expect(texts('summary-item-title')).toEqual(['The Silent Harbor', 'The Silent Harbor', 'The Silent Harbor']);
    expect(texts('summary-item-datetime')).toEqual(['2026-09-15 16:00', '2026-09-15 16:00', '2026-09-15 16:00']);
    expect(texts('summary-item-row')).toEqual(['2', '9', '15']);
    expect(texts('summary-item-seat')).toEqual(['6', '20', 'Couch 3-4']);
    expect(texts('summary-item-price')).toEqual(['25.00 PLN', '32.00 PLN', '89.00 PLN']);
    expect(el('summary-total').textContent?.trim()).toBe('Total: 146.00 PLN');
  });

  it('Remove takes the item out of the booking and updates the total', async () => {
    await openSummary([seat(2, 6), couch(15, 3)]);

    click(el('summary-item-remove-button'));

    expect(texts('summary-item')).toHaveLength(1);
    expect(el('summary-total').textContent?.trim()).toBe('Total: 89.00 PLN');
    expect(TestBed.inject(BookingService).current()?.seats).toEqual([couch(15, 3)]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('removing the last item opens the seat map', async () => {
    await openSummary([seat(2, 6)]);

    click(el('summary-item-remove-button'));

    expect(TestBed.inject(BookingService).current()?.seats).toEqual([]);
    expect(navigate).toHaveBeenCalledWith(['/screenings', 1, 'seats']);
  });

  it('Back opens the seat map and Confirm opens the checkout', async () => {
    await openSummary([seat(2, 6)]);

    click(el('back-button'));
    expect(navigate).toHaveBeenLastCalledWith(['/screenings', 1, 'seats']);

    click(el('confirm-button'));
    expect(navigate).toHaveBeenLastCalledWith(['/screenings', 1, 'checkout']);
  });

  it('redirects to the movie list when the screening cannot be loaded', async () => {
    TestBed.inject(BookingService).save({ screeningId: 1, seats: [seat(2, 6)] });
    fixture = TestBed.createComponent(Summary);
    fixture.detectChanges();
    http.expectOne(`${API}/screenings/1`).flush('Not found', { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
