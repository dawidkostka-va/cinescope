import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BookingService } from '../core/booking.service';
import { SeatMapComponent } from './seat-map';

const q = (el: HTMLElement, testid: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${testid}"]`));

describe('SeatMapComponent', () => {
  async function setup() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SeatMapComponent);
    http
      .expectOne('http://localhost:3000/screenings/0')
      .flush({ id: 0, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: ['R3C7', 'R15C5', 'R15C6'] });
    http
      .expectOne('http://localhost:3000/movies/1')
      .flush({ id: 1, title: 'X', genre: 'Drama', runtimeMinutes: 100, format: 'PL dubbing' });
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, booking: TestBed.inject(BookingService) };
  }

  it('draws the auditorium geometry', async () => {
    const { el } = await setup();
    expect(q(el, 'seat-row')).toHaveLength(15);
    expect(q(el, 'seat')).toHaveLength(296);
    expect(q(el, 'couch')).toHaveLength(12);
    expect(q(el, 'aisle')).toHaveLength(30);
    expect(q(el, 'row-label-left')).toHaveLength(15);
    expect(q(el, 'row-label-right')).toHaveLength(15);
    expect(q(el, 'seat').filter((s) => s.dataset['state'] === 'accessible')).toHaveLength(6);
    expect(q(el, 'seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    const row1 = q(el, 'seat').filter((s) => s.dataset['row'] === '1').map((s) => s.textContent);
    expect(row1[0]).toBe('5');
    expect(row1).toHaveLength(20);
  });

  it('marks occupied seats and couches unavailable', async () => {
    const { el } = await setup();
    const seat = q(el, 'seat').find((s) => s.dataset['row'] === '3' && s.dataset['column'] === '7')!;
    expect(seat.dataset['state']).toBe('unavailable');
    const couch = q(el, 'couch').find((s) => s.dataset['columnStart'] === '5')!;
    expect(couch.dataset['state']).toBe('unavailable');
    seat.click();
    expect(seat.dataset['state']).toBe('unavailable');
  });

  it('selects, caps at 10 seats and reports the panel', async () => {
    const { fixture, el, booking } = await setup();
    const seats = q(el, 'seat').filter((s) => s.dataset['row'] === '7');
    for (const s of seats.slice(0, 9)) s.click();
    fixture.detectChanges();
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 9');
    const couch = q(el, 'couch')[0];
    couch.click();
    fixture.detectChanges();
    expect(couch.dataset['state']).toBe('available');
    expect(booking.seats()).toHaveLength(9);
    seats[9].click();
    fixture.detectChanges();
    expect(booking.seats()).toHaveLength(10);
    seats[0].click();
    seats[1].click();
    couch.click();
    fixture.detectChanges();
    expect(couch.dataset['state']).toBe('selected');
    expect(q(el, 'selected-seats-row').at(-1)!.textContent).toBe('Row 15: 1-2');
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 10');
  });
});
