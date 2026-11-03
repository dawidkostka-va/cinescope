import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { BookingService, buildTickets } from '../booking.service';
import { CheckoutPage } from './checkout';
import { SeatMapPage } from './seat-map';
import { ActivatedRoute } from '@angular/router';

const screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R15C6'],
};
const movie = { id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' };

function setup() {
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
}

const q = (root: HTMLElement, id: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

describe('seat map', () => {
  it('draws the auditorium and enforces the seat limit', async () => {
    setup();
    const fixture = TestBed.createComponent(SeatMapPage);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:3000/screenings/1').flush(screening);
    http.expectOne('http://localhost:3000/movies/1').flush(movie);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(q(el, 'seat-row').length).toBe(15);
    expect(q(el, 'seat').length + q(el, 'couch').length).toBe(308);
    expect(q(el, 'couch').length).toBe(12);
    expect(q(el, 'aisle').length).toBe(30);
    expect(q(el, 'seat').filter((s) => s.dataset['state'] === 'accessible').length).toBe(6);
    expect(q(el, 'seat').filter((s) => s.dataset['state'] === 'unavailable').length).toBe(1);
    expect(q(el, 'couch').filter((s) => s.dataset['state'] === 'unavailable').length).toBe(1);
    expect(q(el, 'seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    const row1 = q(el, 'seat-row')[0];
    expect(Array.from(row1.querySelectorAll('[data-testid="seat"]'))[0].textContent?.trim()).toBe('5');

    const seats = q(el, 'seat').filter((s) => s.dataset['row'] === '7');
    for (const s of seats.slice(0, 8)) s.click();
    q(el, 'couch')[0].click();
    await fixture.whenStable();
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 10');
    q(el, 'couch')[1].click();
    await fixture.whenStable();
    expect(q(el, 'selected-seats-count')[0].textContent).toBe('Selected seats: 10');
    expect(q(document.body, 'toast')[0]?.textContent).toBe('Maximum 10 seats per booking');
    expect(q(el, 'selected-seats-row').map((r) => r.textContent)).toEqual([
      'Row 7: 5, 6, 7, 8, 9, 10, 11, 12',
      'Row 15: 1-2',
    ]);
  });
});

describe('tickets', () => {
  it('groups couches and prices rows', () => {
    const t = buildTickets(['R15C4', 'R15C3', 'R1C10', 'R6C5', 'R12C1']);
    expect(t.map((x) => [x.row, x.price])).toEqual([[1, 25], [6, 32], [12, 39], [15, 89]]);
  });
});

describe('checkout', () => {
  it('validates and shows messages', async () => {
    setup();
    const booking = TestBed.inject(BookingService);
    booking.openFor(1);
    booking.setSeats(['R1C5', 'R15C1', 'R15C2']);
    const fixture = TestBed.createComponent(CheckoutPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(q(el, 'pay-button')[0].textContent?.trim()).toBe('Pay 114.00 PLN');
    expect(q(el, 'first-name-error').length).toBe(0);
    q(el, 'pay-button')[0].click();
    await fixture.whenStable();
    expect(q(el, 'first-name-error')[0].textContent).toBe('First name is required');
    expect(q(el, 'confirm-email-error')[0].textContent).toBe('Confirm email is required');
    expect(q(el, 'terms-error')[0].textContent).toBe('You must accept the terms and conditions');
    expect(q(el, 'phone-error').length).toBe(0);
    expect(q(document.body, 'toast')[0].textContent).toBe('The form contains errors');
  });
});
