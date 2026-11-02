import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { SeatSelection } from './seat-selection';

describe('SeatSelection', () => {
  async function render() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '1']]) } } },
        {
          provide: ApiService,
          useValue: {
            screening: () =>
              of({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: ['R3C7', 'R15C5', 'R15C6'] }),
            movie: () => of({ id: 1, title: 'X', genre: 'Drama', runtimeMinutes: 100, format: 'PL dubbing' }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(SeatSelection);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const all = (el: HTMLElement, id: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('draws the auditorium', async () => {
    const el = await render();
    expect(all(el, 'seat-row').length).toBe(15);
    expect(all(el, 'seat').length + all(el, 'couch').length).toBe(308);
    expect(all(el, 'seat').length).toBe(296);
    expect(all(el, 'aisle').length).toBe(30);
    expect(all(el, 'row-label-left').length).toBe(15);
    expect(all(el, 'seat').filter((s) => s.dataset['state'] === 'accessible').length).toBe(6);
    expect(all(el, 'seat').filter((s) => s.dataset['state'] === 'unavailable').length).toBe(1);
    expect(all(el, 'couch').filter((s) => s.dataset['state'] === 'unavailable').length).toBe(1);
    expect(el.querySelector('[data-testid="seat-map-subtitle"]')?.textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(all(el, 'seat').find((s) => s.dataset['row'] === '1' && s.dataset['column'] === '5')?.textContent).toBe('5');
    expect(all(el, 'couch')[0].textContent).toBe('1-2');
  });

  it('selects, caps and deselects', async () => {
    const el = await render();
    const seat = (r: number, c: number) =>
      all(el, 'seat').find((s) => s.dataset['row'] === String(r) && s.dataset['column'] === String(c))!;
    const fixtureRefresh = () => TestBed.inject(BookingService).booking();
    seat(7, 11).click();
    seat(7, 12).click();
    all(el, 'couch')[0].click();
    TestBed.tick();
    expect(el.querySelector('[data-testid="selected-seats-count"]')?.textContent).toBe('Selected seats: 4');
    expect(all(el, 'selected-seats-row').map((r) => r.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    expect(fixtureRefresh()?.seats).toEqual(['R7C11', 'R7C12', 'R15C1', 'R15C2']);
    seat(7, 12).click();
    TestBed.tick();
    expect(el.querySelector('[data-testid="selected-seats-count"]')?.textContent).toBe('Selected seats: 3');
  });
});
