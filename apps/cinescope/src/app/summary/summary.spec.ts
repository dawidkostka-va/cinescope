import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import type { MockInstance } from 'vitest';
import { BookingService } from '../booking.service';
import { Movie, Screening } from '../models';
import { Summary } from './summary';

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
  occupiedSeats: [],
};

describe('Summary', () => {
  let fixture: ComponentFixture<Summary>;
  let http: HttpTestingController;
  let navigate: MockInstance;

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
    const router = TestBed.inject(Router);
    navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Summary);
  });

  afterEach(() => http.verify());

  function select(...units: { row: number; column: number; couch: boolean }[]): void {
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    units.forEach((unit) => booking.toggle(unit));
  }

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

  function text(testId: string): string[] {
    return all(testId).map((el) => el.textContent?.trim() ?? '');
  }

  function click(el: HTMLElement): void {
    el.click();
    fixture.detectChanges();
  }

  it('lists the selected items sorted by row with title, date, row, seat and price', async () => {
    select(
      { row: 7, column: 12, couch: false },
      { row: 2, column: 11, couch: false },
      { row: 15, column: 3, couch: true },
    );
    await load();
    expect(one('summary-title').textContent?.trim()).toBe('Your tickets');
    expect(all('summary-item')).toHaveLength(3);
    expect(text('summary-item-title')).toEqual([
      'The Silent Harbor',
      'The Silent Harbor',
      'The Silent Harbor',
    ]);
    expect(text('summary-item-datetime')).toEqual([
      '2026-09-15 16:00',
      '2026-09-15 16:00',
      '2026-09-15 16:00',
    ]);
    expect(text('summary-item-row')).toEqual(['2', '7', '15']);
    expect(text('summary-item-seat')).toEqual(['11', '12', 'Couch 3-4']);
    expect(text('summary-item-price')).toEqual(['25.00 PLN', '32.00 PLN', '89.00 PLN']);
    expect(one('summary-total').textContent?.trim()).toBe('Total: 146.00 PLN');
  });

  it('removes an item and updates the total', async () => {
    select(
      { row: 2, column: 11, couch: false },
      { row: 7, column: 12, couch: false },
      { row: 15, column: 3, couch: true },
    );
    await load();
    click(all('summary-item-remove-button')[1]);
    expect(all('summary-item')).toHaveLength(2);
    expect(one('summary-total').textContent?.trim()).toBe('Total: 114.00 PLN');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('returns to the seat map when the last item is removed', async () => {
    select({ row: 12, column: 1, couch: false });
    await load();
    click(one('summary-item-remove-button'));
    expect(navigate).toHaveBeenCalledWith(['/screenings', 1, 'seats']);
  });

  it('Back opens the seat map and Confirm opens the checkout', async () => {
    select({ row: 12, column: 1, couch: false });
    await load();
    click(one('back-button'));
    expect(navigate).toHaveBeenLastCalledWith(['/screenings', 1, 'seats']);
    click(one('confirm-button'));
    expect(navigate).toHaveBeenLastCalledWith(['/screenings', 1, 'checkout']);
  });

  it('redirects to the movie list when the screening cannot be loaded', async () => {
    fixture.detectChanges();
    http
      .expectOne(`${API}/screenings/1`)
      .flush('missing', { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
