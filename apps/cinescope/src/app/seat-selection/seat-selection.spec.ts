import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { Movie, Screening } from '../models';
import { ToastService } from '../toast/toast.service';
import { SeatSelection } from './seat-selection';

const API = 'http://localhost:3000';

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
  occupiedSeats: ['R3C7', 'R15C5', 'R1C10'],
};

describe('SeatSelection', () => {
  let fixture: ComponentFixture<SeatSelection>;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [SeatSelection],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SeatSelection);
  });

  afterEach(() => http.verify());

  async function load(): Promise<void> {
    fixture.detectChanges();
    http.expectOne(`${API}/screenings/1`).flush(screening);
    http.expectOne(`${API}/movies/1`).flush(movie);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function all(testId: string): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll(`[data-testid="${testId}"]`));
  }

  function one(testId: string): HTMLElement {
    return all(testId)[0];
  }

  it('shows the title, show date and seat limit text', async () => {
    await load();
    expect(one('seat-map-title').textContent).toContain('Choose your seats');
    expect(one('seat-map-subtitle').textContent).toContain('Show Date: Tuesday 15 Sep 16:00');
    expect(one('seat-limit-info').textContent).toContain(
      'You can reserve up to 10 seats per reservation',
    );
    expect(one('screen-indicator').textContent).toContain('SCREEN');
  });

  it('renders 15 rows with row labels on both edges', async () => {
    await load();
    expect(all('seat-row').map((row) => row.getAttribute('data-row'))).toEqual(
      Array.from({ length: 15 }, (_, i) => String(i + 1)),
    );
    expect(all('row-label-left').map((label) => label.textContent?.trim())).toEqual(
      Array.from({ length: 15 }, (_, i) => String(i + 1)),
    );
    expect(all('row-label-right')).toHaveLength(15);
  });

  it('renders 308 selectable elements: 296 seats and 12 couches', async () => {
    await load();
    expect(all('seat')).toHaveLength(296);
    expect(all('couch')).toHaveLength(12);
    expect(all('aisle')).toHaveLength(30);
  });

  it('reports occupied seats as unavailable and accessible seats as accessible', async () => {
    await load();
    const seat = (row: number, column: number) =>
      all('seat').find(
        (el) =>
          el.getAttribute('data-row') === String(row) &&
          el.getAttribute('data-column') === String(column),
      );
    expect(seat(3, 7)?.getAttribute('data-state')).toBe('unavailable');
    expect(seat(1, 10)?.getAttribute('data-state')).toBe('unavailable');
    expect(seat(1, 11)?.getAttribute('data-state')).toBe('accessible');
    expect(seat(2, 11)?.getAttribute('data-state')).toBe('available');
  });

  it('marks a couch unavailable when either of its seats is occupied', async () => {
    await load();
    const couch = all('couch').find((el) => el.getAttribute('data-column-start') === '5');
    expect(couch?.getAttribute('data-state')).toBe('unavailable');
    expect(couch?.textContent?.trim()).toBe('5-6');
    const free = all('couch').find((el) => el.getAttribute('data-column-start') === '7');
    expect(free?.getAttribute('data-state')).toBe('available');
  });

  function seatEl(row: number, column: number): HTMLElement {
    return all('seat').find(
      (el) =>
        el.getAttribute('data-row') === String(row) &&
        el.getAttribute('data-column') === String(column),
    ) as HTMLElement;
  }

  function couchEl(columnStart: number): HTMLElement {
    return all('couch').find(
      (el) => el.getAttribute('data-column-start') === String(columnStart),
    ) as HTMLElement;
  }

  function click(el: HTMLElement): void {
    el.click();
    fixture.detectChanges();
  }

  it('selects and deselects an available seat on click', async () => {
    await load();
    click(seatEl(2, 11));
    expect(seatEl(2, 11).getAttribute('data-state')).toBe('selected');
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 1');
    expect(one('selected-seats-row').textContent?.trim()).toBe('Row 2: 11');

    click(seatEl(2, 11));
    expect(seatEl(2, 11).getAttribute('data-state')).toBe('available');
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 0');
    expect(all('selected-seats-row')).toHaveLength(0);
  });

  it('selects an accessible seat and reports it as selected', async () => {
    await load();
    click(seatEl(1, 11));
    expect(seatEl(1, 11).getAttribute('data-state')).toBe('selected');
  });

  it('ignores clicks on unavailable seats', async () => {
    await load();
    click(seatEl(3, 7));
    expect(seatEl(3, 7).getAttribute('data-state')).toBe('unavailable');
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 0');
  });

  it('selects a couch as two seats and deselects it as one unit', async () => {
    await load();
    click(couchEl(7));
    expect(couchEl(7).getAttribute('data-state')).toBe('selected');
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 2');
    expect(one('selected-seats-row').textContent?.trim()).toBe('Row 15: 7-8');

    click(couchEl(7));
    expect(couchEl(7).getAttribute('data-state')).toBe('available');
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 0');
  });

  it('ignores clicks on an unavailable couch', async () => {
    await load();
    click(couchEl(5));
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 0');
  });

  it('blocks selection beyond 10 seats, shows a toast, and still allows deselection', async () => {
    await load();
    const toast = TestBed.inject(ToastService);
    const show = vi.spyOn(toast, 'show');

    const rowTwo = all('seat').filter((el) => el.getAttribute('data-row') === '2');
    rowTwo.slice(0, 8).forEach(click);
    click(couchEl(7));
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 10');
    expect(show).not.toHaveBeenCalled();

    click(rowTwo[8]);
    expect(rowTwo[8].getAttribute('data-state')).toBe('available');
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 10');
    expect(show).toHaveBeenCalledWith('Maximum 10 seats per booking');

    click(rowTwo[0]);
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 9');
  });

  it('lists the legend entries in order', async () => {
    await load();
    expect(all('legend-item').map((el) => el.getAttribute('data-state'))).toEqual([
      'available',
      'selected',
      'unavailable',
      'accessible',
    ]);
    expect(one('legend').textContent).toContain('Available');
  });

  it('disables Continue until a seat is selected and Cancel clears the selection', async () => {
    await load();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const continueButton = one('continue-button') as HTMLButtonElement;
    expect(continueButton.disabled).toBe(true);

    click(seatEl(2, 11));
    expect(continueButton.disabled).toBe(false);

    click(one('cancel-button'));
    expect(navigate).toHaveBeenCalledWith(['/']);
    fixture.detectChanges();
    expect(one('selected-seats-count').textContent?.trim()).toBe('Selected seats: 0');
  });

  it('redirects to the movie list when the screening cannot be loaded', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    http
      .expectOne(`${API}/screenings/1`)
      .flush('missing', { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
