import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SeatSelection } from './seat-selection';

describe('SeatSelection', () => {
  async function setup() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [SeatSelection, MatSnackBarModule],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(SeatSelection);
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('http://localhost:3000/screenings/')
      .flush({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: ['R3C7', 'R15C5', 'R15C6'] });
    http
      .expectOne('http://localhost:3000/movies/1')
      .flush({ id: 1, title: 'X', genre: 'Drama', runtimeMinutes: 100, format: 'PL dubbing' });
    await fixture.whenStable();
    return fixture;
  }
  const q = (el: HTMLElement, id: string) => [...el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];

  it('renders the auditorium', async () => {
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(q(el, 'seat').length).toBe(296);
    expect(q(el, 'couch').length).toBe(12);
    expect(q(el, 'aisle').length).toBe(30);
    expect(q(el, 'seat-row').length).toBe(15);
    expect(q(el, 'row-label-left').length).toBe(15);
    expect(q(el, 'seat-map-subtitle')[0].textContent!.trim()).toBe('Show Date: Tuesday 15 Sep 16:00');
    const states = new Set(q(el, 'seat').map((s) => s.dataset['state']));
    expect(states).toEqual(new Set(['available', 'unavailable', 'accessible']));
    const row15 = q(el, 'couch').find((c) => c.dataset['columnStart'] === '5')!;
    expect(row15.dataset['state']).toBe('unavailable');
  });

  it('selects, lists and limits seats', async () => {
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    const seat = (row: number, col: number) =>
      q(el, 'seat').find((s) => s.dataset['row'] === String(row) && s.dataset['column'] === String(col))!;
    seat(7, 12).click();
    seat(7, 11).click();
    q(el, 'couch')[0].click();
    await fixture.whenStable();
    expect(q(el, 'selected-seats-count')[0].textContent!.trim()).toBe('Selected seats: 4');
    expect(q(el, 'selected-seats-row').map((r) => r.textContent!.trim())).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    seat(3, 7).click();
    await fixture.whenStable();
    expect(seat(3, 7).dataset['state']).toBe('unavailable');
  });
});
