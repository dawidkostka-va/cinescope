import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { SeatSelectionComponent } from './seat-selection';

describe('SeatSelectionComponent', () => {
  function setup(occupied: string[]) {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        {
          provide: ApiService,
          useValue: {
            screening: () => of({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: occupied }),
            movie: () => of({ id: 1, title: 'X', genre: 'Drama', runtimeMinutes: 100, format: 'PL dubbing' }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(SeatSelectionComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const q = (sel: string) => Array.from(el.querySelectorAll<HTMLElement>(sel));
    return { fixture, el, q, snack: TestBed.inject(MatSnackBar) };
  }

  it('draws the auditorium geometry', () => {
    const { el, q } = setup([]);
    expect(el.querySelector('[data-testid=seat-map-subtitle]')?.textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(q('[data-testid=seat-row]').length).toBe(15);
    expect(q('[data-testid=seat]').length).toBe(296);
    expect(q('[data-testid=couch]').length).toBe(12);
    expect(q('[data-testid=aisle]').length).toBe(30);
    expect(q('[data-testid=row-label-left]').length).toBe(15);
    expect(q('[data-testid=row-label-right]').length).toBe(15);
    const row1 = q('[data-testid=seat-row][data-row="1"] [data-testid=seat]');
    expect(row1.length).toBe(20);
    expect(row1[0].textContent).toBe('5');
    expect(row1.filter((s) => s.dataset['state'] === 'accessible').map((s) => s.textContent)).toEqual(
      ['10', '11', '12', '13', '14', '15'],
    );
    expect(q('[data-testid=seat-row][data-row="11"] [data-testid=seat]').length).toBe(24);
    expect(q('[data-testid=couch]')[11].textContent).toBe('23-24');
  });

  it('marks occupied seats and couches unavailable', () => {
    const { q } = setup(['R3C7', 'R15C6', 'R1C10']);
    const state = (sel: string) => q(sel)[0].dataset['state'];
    expect(state('[data-testid=seat][data-row="3"][data-column="7"]')).toBe('unavailable');
    expect(state('[data-testid=seat][data-row="1"][data-column="10"]')).toBe('unavailable');
    expect(state('[data-testid=couch][data-column-start="5"]')).toBe('unavailable');
    expect(state('[data-testid=couch][data-column-start="3"]')).toBe('available');
  });

  it('selects, deselects, caps at 10 and lists the selection', () => {
    const { fixture, q, snack } = setup(['R3C7']);
    const click = (sel: string) => {
      q(sel)[0].click();
      fixture.detectChanges();
    };
    click('[data-testid=seat][data-row="3"][data-column="7"]');
    expect(TestBed.inject(BookingService).seatCount()).toBe(0);

    click('[data-testid=seat][data-row="7"][data-column="12"]');
    click('[data-testid=seat][data-row="7"][data-column="11"]');
    click('[data-testid=couch][data-column-start="1"]');
    expect(q('[data-testid=selected-seats-count]')[0].textContent).toBe('Selected seats: 4');
    expect(q('[data-testid=selected-seats-row]').map((r) => r.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);

    click('[data-testid=seat][data-row="7"][data-column="11"]');
    expect(q('[data-testid=selected-seats-count]')[0].textContent).toBe('Selected seats: 3');

    for (const c of [3, 5, 7]) click(`[data-testid=couch][data-column-start="${c}"]`);
    expect(TestBed.inject(BookingService).seatCount()).toBe(9);
    const open = vi.spyOn(snack, 'openFromComponent');
    click('[data-testid=couch][data-column-start="9"]');
    expect(TestBed.inject(BookingService).seatCount()).toBe(9);
    expect(open).toHaveBeenCalledTimes(1);
    click('[data-testid=seat][data-row="9"][data-column="9"]');
    expect(TestBed.inject(BookingService).seatCount()).toBe(10);
    click('[data-testid=couch][data-column-start="1"]');
    expect(TestBed.inject(BookingService).seatCount()).toBe(8);
  });
});
