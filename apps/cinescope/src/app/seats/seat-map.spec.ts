import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BookingService } from '../core/booking.service';
import { SeatMap } from './seat-map';

async function setup() {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'screenings/:id/seats', component: SeatMap }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
      },
    ],
  });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(SeatMap);
  http.expectOne('http://localhost:3000/screenings/1').flush({
    id: 1,
    movieId: 1,
    date: '2026-09-15',
    time: '16:00',
    occupiedSeats: ['R3C7', 'R15C5', 'R15C6'],
  });
  http
    .expectOne('http://localhost:3000/movies/1')
    .flush({ id: 1, title: 'T', genre: 'G', runtimeMinutes: 1, format: 'PL dubbing' });
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
  return { fixture, root, q, booking: TestBed.inject(BookingService) };
}

describe('SeatMap', () => {
  it('draws the auditorium', async () => {
    const { q, root } = await setup();
    expect(q('[data-testid=seat-row]').length).toBe(15);
    expect(q('[data-testid=seat]').length).toBe(296);
    expect(q('[data-testid=couch]').length).toBe(12);
    expect(q('[data-testid=aisle]').length).toBe(30);
    expect(q('[data-testid=seat][data-state=accessible]').length).toBe(6);
    expect(q('[data-testid=seat-row][data-row="1"] [data-testid=seat]')[0].textContent).toBe('5');
    expect(q('[data-testid=seat-row][data-row="11"] [data-testid=seat]')[0].textContent).toBe('1');
    expect(q('[data-testid=couch][data-column-start="5"]')[0].dataset['state']).toBe('unavailable');
    expect(q('[data-testid=seat][data-row="3"][data-column="7"]')[0].dataset['state']).toBe(
      'unavailable',
    );
    expect(root.querySelector('[data-testid=seat-map-subtitle]')?.textContent).toBe(
      'Show Date: Tuesday 15 Sep 16:00',
    );
  });

  it('selects, caps and summarises', async () => {
    const { q, fixture, root, booking } = await setup();
    const click = async (sel: string) => {
      q(sel)[0].click();
      await fixture.whenStable();
    };
    await click('[data-testid=seat][data-row="7"][data-column="12"]');
    await click('[data-testid=seat][data-row="7"][data-column="11"]');
    await click('[data-testid=couch][data-column-start="1"]');
    expect(root.querySelector('[data-testid=selected-seats-count]')?.textContent).toBe(
      'Selected seats: 4',
    );
    expect(q('[data-testid=selected-seats-row]').map((e) => e.textContent)).toEqual([
      'Row 7: 11, 12',
      'Row 15: 1-2',
    ]);
    expect(booking.total()).toBe(32 + 32 + 89);
    await click('[data-testid=seat][data-row="3"][data-column="7"]');
    expect(booking.booking().seats.length).toBe(4);
    for (const c of [5, 6, 7, 8])
      await click(`[data-testid=seat][data-row="8"][data-column="${c}"]`);
    expect(booking.booking().seats.length).toBe(8);
    await click('[data-testid=couch][data-column-start="3"]');
    expect(booking.booking().seats.length).toBe(10);
    await click('[data-testid=seat][data-row="9"][data-column="5"]');
    expect(booking.booking().seats.length).toBe(10);
    await click('[data-testid=couch][data-column-start="3"]');
    expect(booking.booking().seats.length).toBe(8);
  });
});
