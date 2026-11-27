import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { SeatMap } from './seat-map';

describe('SeatMap', () => {
  function setup() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    });
    const fixture = TestBed.createComponent(SeatMap);
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('http://localhost:3000/screenings/1')
      .flush({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: ['R3C7', 'R15C5', 'R15C6'] });
    http
      .expectOne('http://localhost:3000/movies/1')
      .flush({ id: 1, title: 'X', genre: 'Drama', runtimeMinutes: 100, format: 'PL dubbing' });
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const q = (el: HTMLElement, id: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('draws the auditorium', () => {
    const { el } = setup();
    expect(q(el, 'seat-row').length).toBe(15);
    expect(q(el, 'seat').length + q(el, 'couch').length).toBe(308);
    expect(q(el, 'couch').length).toBe(12);
    expect(q(el, 'aisle').length).toBe(30);
    expect(q(el, 'seat').filter((s) => s.dataset['state'] === 'accessible').length).toBe(6);
    expect(q(el, 'seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(q(el, 'couch').filter((c) => c.dataset['state'] === 'unavailable').length).toBe(1);
  });

  it('selects, caps and lists seats', () => {
    const { fixture, el } = setup();
    const seat = (row: number, col: number) =>
      q(el, 'seat').find((s) => s.dataset['row'] === String(row) && s.dataset['column'] === String(col))!;
    const click = (e: HTMLElement) => {
      e.click();
      fixture.detectChanges();
    };
    click(seat(7, 12));
    click(seat(7, 11));
    click(q(el, 'couch')[0]);
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 4');
    expect(q(el, 'selected-seats-row').map((r) => r.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    click(seat(7, 12));
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 3');
    click(seat(3, 7));
    expect(seat(3, 7).dataset['state']).toBe('unavailable');
    for (let c = 5; c <= 11; c++) click(seat(2, c));
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 10');
    click(seat(2, 12));
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 10');
    expect(seat(2, 12).dataset['state']).toBe('available');
  });
});
