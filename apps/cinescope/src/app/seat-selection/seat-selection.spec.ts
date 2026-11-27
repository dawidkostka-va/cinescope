import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Booking } from '../core/booking';
import { SeatSelection } from './seat-selection';

describe('SeatSelection', () => {
  function setup() {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    });
    const fixture = TestBed.createComponent(SeatSelection);
    TestBed.inject(HttpTestingController)
      .expectOne('http://localhost:3000/screenings/1')
      .flush({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: ['R3C7', 'R15C5'] });
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
    expect(q(el, 'seat').filter((s) => s.dataset['state'] === 'unavailable').length).toBe(1);
    expect(q(el, 'couch').filter((s) => s.dataset['state'] === 'unavailable').length).toBe(1);
    expect(q(el, 'seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
  });

  it('selects, caps and lists seats', () => {
    const { fixture, el } = setup();
    const click = (testid: string, filter: (e: HTMLElement) => boolean) => {
      q(el, testid).find(filter)!.click();
      fixture.detectChanges();
    };
    click('seat', (s) => s.dataset['row'] === '7' && s.dataset['column'] === '12');
    click('seat', (s) => s.dataset['row'] === '7' && s.dataset['column'] === '11');
    click('couch', (s) => s.dataset['columnStart'] === '1');
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 4');
    expect(q(el, 'selected-seats-row').map((r) => r.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    expect(TestBed.inject(Booking).total()).toBe(32 * 2 + 89);
  });
});
