import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BookingStore } from '../core/booking';
import { SeatMap } from './seat-map';

describe('SeatMap', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '1']]) } } },
      ],
    });
  });

  async function open() {
    const fixture = TestBed.createComponent(SeatMap);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:3000/screenings/1').flush({
      id: 1,
      movieId: 1,
      date: '2026-09-15',
      time: '16:00',
      occupiedSeats: ['R3C7', 'R15C5', 'R15C6', 'R1C10', 'R9C9'],
    });
    http.expectOne('http://localhost:3000/movies/1').flush({ id: 1 });
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const q = (el: HTMLElement, id: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('renders the auditorium', async () => {
    const el = await open();
    expect(q(el, 'seat').length + q(el, 'couch').length).toBe(308);
    expect(q(el, 'seat-row')).toHaveLength(15);
    expect(q(el, 'aisle')).toHaveLength(30);
    expect(q(el, 'row-label-left')).toHaveLength(15);
    expect(q(el, 'seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    const states = (sel: string) => el.querySelector(sel)?.getAttribute('data-state');
    expect(states('[data-testid=seat][data-row="3"][data-column="7"]')).toBe('unavailable');
    expect(states('[data-testid=seat][data-row="1"][data-column="10"]')).toBe('unavailable');
    expect(states('[data-testid=seat][data-row="1"][data-column="11"]')).toBe('accessible');
    expect(states('[data-testid=couch][data-column-start="5"]')).toBe('unavailable');
    expect(q(el, 'seat').find((s) => s.dataset['row'] === '1' && s.dataset['column'] === '11')?.textContent).toBe('11');
  });

  it('selects seats, caps at 10 seats and counts couches as 2', async () => {
    const el = await open();
    const click = async (sel: string) => {
      el.querySelector<HTMLElement>(sel)!.click();
      TestBed.tick();
    };
    await click('[data-testid=seat][data-row="7"][data-column="12"]');
    await click('[data-testid=seat][data-row="7"][data-column="11"]');
    await click('[data-testid=couch][data-column-start="1"]');
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 4');
    expect(q(el, 'selected-seats-row').map((r) => r.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    await click('[data-testid=seat][data-row="7"][data-column="11"]');
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 3');

    for (let column = 5; column <= 11; column++) {
      await click(`[data-testid=seat][data-row="12"][data-column="${column}"]`);
    }
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 10');
    await click('[data-testid=seat][data-row="12"][data-column="20"]');
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 10');
    await click('[data-testid=couch][data-column-start="1"]');
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 8');
    expect(TestBed.inject(BookingStore).seats()).toHaveLength(8);
    expect(JSON.parse(sessionStorage.getItem('cinescope.booking')!).seats).toHaveLength(8);
  });
});
