import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService } from '../booking.service';
import { ToastService } from '../toast.service';
import { SeatMap } from './seat-map';

describe('SeatMap', () => {
  const toast = { show: vi.fn() };

  function setup() {
    sessionStorage.clear();
    toast.show.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        {
          provide: ApiService,
          useValue: {
            getScreening: () =>
              of({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: ['R3C7', 'R15C5', 'R1C10'] }),
            getMovie: () => of({ id: 1, title: 'T', genre: 'G', runtimeMinutes: 100, format: 'PL dubbing' }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(SeatMap);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
    const seat = (row: number, col: number) => root.querySelector<HTMLElement>(`[data-testid=seat][data-row="${row}"][data-column="${col}"]`)!;
    const couch = (row: number, start: number) => root.querySelector<HTMLElement>(`[data-testid=couch][data-row="${row}"][data-column-start="${start}"]`)!;
    const click = (el: HTMLElement) => {
      el.click();
      fixture.detectChanges();
    };
    return { fixture, root, q, seat, couch, click };
  }

  it('draws the auditorium', () => {
    const { root, q, seat, couch } = setup();
    expect(q('[data-testid=seat-row]').length).toBe(15);
    expect(q('[data-testid=seat]').length).toBe(296);
    expect(q('[data-testid=couch]').length).toBe(12);
    expect(q('[data-testid=aisle]').length).toBe(30);
    expect(q('[data-testid=row-label-left]').length).toBe(15);
    expect(q('[data-testid=row-label-right]').length).toBe(15);
    expect(root.querySelector('[data-testid=seat-map-subtitle]')!.textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(root.querySelector('[data-testid=seat][data-row="1"][data-column="4"]')).toBeNull();
    expect(root.querySelector('[data-testid=seat][data-row="11"][data-column="1"]')).not.toBeNull();
    expect(seat(3, 7).dataset['state']).toBe('unavailable');
    expect(seat(1, 10).dataset['state']).toBe('unavailable');
    expect(seat(1, 11).dataset['state']).toBe('accessible');
    expect(seat(2, 5).dataset['state']).toBe('available');
    expect(couch(15, 5).dataset['state']).toBe('unavailable');
    expect(q('[data-testid=seat-row][data-row="15"] [data-testid=seat]').length).toBe(0);
    expect(seat(1, 5).textContent).toBe('5');
  });

  it('selects, deselects and limits seats', () => {
    const { root, q, seat, couch, click } = setup();
    const count = () => root.querySelector('[data-testid=selected-seats-count]')!.textContent;
    click(seat(7, 12));
    click(seat(7, 11));
    click(couch(15, 1));
    expect(seat(7, 12).dataset['state']).toBe('selected');
    expect(couch(15, 1).dataset['state']).toBe('selected');
    expect(count()).toBe('Selected seats: 4');
    expect(q('[data-testid=selected-seats-row]').map((e) => e.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);

    click(seat(3, 7));
    expect(count()).toBe('Selected seats: 4');

    for (const c of [5, 6, 7]) click(seat(2, c));
    expect(count()).toBe('Selected seats: 7');
    click(couch(15, 3));
    expect(count()).toBe('Selected seats: 9');
    click(seat(2, 8));
    expect(count()).toBe('Selected seats: 10');
    click(seat(2, 9));
    expect(count()).toBe('Selected seats: 10');
    expect(toast.show).toHaveBeenCalledWith('Maximum 10 seats per booking');
    click(couch(15, 3));
    click(seat(2, 8));
    expect(count()).toBe('Selected seats: 7');
    click(seat(7, 12));
    expect(seat(7, 12).dataset['state']).toBe('available');
    expect(TestBed.inject(BookingService).booking()!.seats).toContain('R15C1');
  });
});
