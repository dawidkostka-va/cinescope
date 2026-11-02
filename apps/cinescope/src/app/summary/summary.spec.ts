import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService } from '../booking.service';
import { Summary } from './summary';

describe('Summary', () => {
  it('lists tickets, removes them and returns to the seat map after the last', () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        {
          provide: ApiService,
          useValue: {
            getScreening: () => of({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: [] }),
            getMovie: () => of({ id: 1, title: 'The Silent Harbor', genre: 'G', runtimeMinutes: 1, format: 'PL dubbing' }),
          },
        },
      ],
    });
    const booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.setSeats(['R15C3', 'R15C4', 'R7C12']);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Summary);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const q = (id: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
    expect(q('summary-item').length).toBe(2);
    expect(q('summary-item-seat').map((e) => e.textContent)).toEqual(['12', 'Couch 3-4']);
    expect(q('summary-item-price').map((e) => e.textContent)).toEqual(['32.00 PLN', '89.00 PLN']);
    expect(q('summary-item-datetime')[0].textContent).toBe('2026-09-15 16:00');
    expect(q('summary-total')[0].textContent).toBe('Total: 121.00 PLN');
    q('summary-item-remove-button')[0].click();
    fixture.detectChanges();
    expect(q('summary-total')[0].textContent).toBe('Total: 89.00 PLN');
    q('summary-item-remove-button')[0].click();
    expect(navigate).toHaveBeenCalledWith(['/screenings', 1, 'seats']);
  });
});
