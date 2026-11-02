import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Api } from '../api.service';
import { SeatMap } from './seat-map';

describe('SeatMap', () => {
  it('renders the auditorium and selects seats', async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: Api,
          useValue: {
            screeningWithMovie: () =>
              of({
                screening: { id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: ['R15C6', 'R1C10'] },
                movie: { id: 1 },
              }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(SeatMap);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const q = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${s}"]`));

    expect(q('seat').length + q('couch').length).toBe(308);
    expect(q('couch').length).toBe(12);
    expect(q('aisle').length).toBe(30);
    expect(q('seat-row').length).toBe(15);
    expect(q('seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(q('couch')[2].dataset['state']).toBe('unavailable');
    expect(q('seat')[5].dataset['state']).toBe('unavailable');

    q('seat')[6].click();
    q('couch')[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(q('selected-seats-count')[0].textContent).toBe('Selected seats: 3');
    expect(q('selected-seats-row').map((e) => e.textContent)).toEqual(['Row 1: 11', 'Row 15: 1-2']);
  });
});
