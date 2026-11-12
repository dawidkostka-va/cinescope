import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BookingService } from '../core/booking.service';
import { SeatMap } from './seat-map';

describe('SeatMap', () => {
  beforeEach(() => sessionStorage.clear());

  async function open() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'screenings/:id/seats', component: SeatMap }]),
        provideNativeDateAdapter(),
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/screenings/1/seats');
    http.expectOne('http://localhost:3000/screenings/1').flush({
      id: 1,
      movieId: 1,
      date: '2026-09-15',
      time: '16:00',
      occupiedSeats: ['R3C7', 'R15C5', 'R15C6'],
    });
    http.expectOne('http://localhost:3000/movies/1').flush({
      id: 1,
      title: 'X',
      genre: 'Y',
      runtimeMinutes: 1,
      format: 'PL dubbing',
    });
    harness.detectChanges();
    const el: HTMLElement = harness.fixture.nativeElement;
    const q = (id: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
    const seat = (row: number, col: number) =>
      q('seat').find((s) => s.dataset['row'] === `${row}` && s.dataset['column'] === `${col}`)!;
    const couch = (start: number) => q('couch').find((c) => c.dataset['columnStart'] === `${start}`)!;
    const count = () => Number(q('selected-seats-count')[0].textContent!.replace(/\D/g, ''));
    return { harness, q, seat, couch, count };
  }

  it('draws the auditorium', async () => {
    const { q, seat, couch } = await open();
    expect(q('seat-row').length).toBe(15);
    expect(q('seat').length).toBe(296);
    expect(q('couch').length).toBe(12);
    expect(q('aisle').length).toBe(30);
    expect(q('row-label-left').length).toBe(15);
    expect(q('row-label-right').length).toBe(15);
    expect(q('seat').filter((s) => s.dataset['state'] === 'accessible').length).toBe(6);
    expect(q('seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(seat(3, 7).dataset['state']).toBe('unavailable');
    expect(couch(5).dataset['state']).toBe('unavailable');
    expect(seat(1, 1)).toBeUndefined();
    expect(seat(11, 1)).toBeDefined();
  });

  it('selects, deselects and caps at 10 seats', async () => {
    const { harness, q, seat, couch, count } = await open();
    seat(7, 12).click();
    seat(7, 11).click();
    couch(1).click();
    harness.detectChanges();
    expect(count()).toBe(4);
    expect(q('selected-seats-row').map((r) => r.textContent)).toEqual([
      'Row 7: 11, 12',
      'Row 15: 1-2',
    ]);

    seat(3, 7).click();
    couch(5).click();
    harness.detectChanges();
    expect(count()).toBe(4);

    for (let col = 5; col <= 10; col++) seat(8, col).click();
    harness.detectChanges();
    expect(count()).toBe(10);
    couch(3).click();
    seat(9, 5).click();
    harness.detectChanges();
    expect(count()).toBe(10);
    expect(seat(9, 5).dataset['state']).toBe('available');

    couch(1).click();
    harness.detectChanges();
    expect(count()).toBe(8);
    expect(TestBed.inject(BookingService).booking()?.items).toContain('R7C12');
  });
});
