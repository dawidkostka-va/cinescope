import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Api } from '../../core/api';
import { BookingStore } from '../../core/booking';
import { SeatSelection } from './seat-selection';

describe('SeatSelection', () => {
  async function render(occupied: string[]) {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: Api,
          useValue: {
            screening: () => of({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: occupied }),
            movie: () => of({ id: 1, title: 'T', genre: 'G', runtimeMinutes: 1, format: 'PL dubbing' }),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SeatSelection);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const q = (el: HTMLElement, id: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('renders the auditorium geometry', async () => {
    const el = await render(['R3C7', 'R15C5']);
    expect(q(el, 'seat-row').length).toBe(15);
    expect(q(el, 'seat').length + q(el, 'couch').length).toBe(308);
    expect(q(el, 'couch').length).toBe(12);
    expect(q(el, 'aisle').length).toBe(30);
    expect(q(el, 'row-label-left').length).toBe(15);
    expect(q(el, 'seat').filter((s) => s.dataset['state'] === 'accessible').length).toBe(6);
    expect(q(el, 'seat').find((s) => s.dataset['row'] === '3' && s.dataset['column'] === '7')!.dataset['state']).toBe(
      'unavailable',
    );
    expect(q(el, 'couch').find((c) => c.dataset['columnStart'] === '5')!.dataset['state']).toBe('unavailable');
    expect(q(el, 'seat').some((s) => s.dataset['row'] === '1' && s.dataset['column'] === '4')).toBe(false);
    expect(q(el, 'seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
  });

  it('selects, caps and summarises', async () => {
    const el = await render([]);
    const click = (row: string, column: string) =>
      q(el, 'seat')
        .find((s) => s.dataset['row'] === row && s.dataset['column'] === column)!
        .click();
    click('7', '12');
    click('7', '11');
    q(el, 'couch')[0].click();
    TestBed.tick();
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 4');
    expect(q(el, 'selected-seats-row').map((r) => r.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    expect(TestBed.inject(BookingStore).total()).toBe(32 * 2 + 89);
    q(el, 'couch')[0].click();
    TestBed.tick();
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 2');
  });
});
