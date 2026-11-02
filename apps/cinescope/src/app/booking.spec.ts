import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { appRoutes } from './app.routes';
import { BookingService } from './booking';
import { AUDITORIUM, formatShowDate, itemsFromIds } from './seat-utils';
import { SeatMap } from './seat-map/seat-map';
import { Checkout } from './checkout/checkout';

describe('seat utils', () => {
  it('has 308 selectable cells and 12 couches', () => {
    const cells = AUDITORIUM.flatMap((r) => r.cells).filter((c) => c.kind === 'seat' || c.kind === 'couch');
    expect(cells.length).toBe(308);
    expect(cells.filter((c) => c.kind === 'couch').length).toBe(12);
    expect(AUDITORIUM.every((r) => r.cells.filter((c) => c.kind === 'aisle').length === 2)).toBe(true);
  });

  it('groups couch ids and prices items', () => {
    const items = itemsFromIds(['R15C4', 'R15C3', 'R7C12', 'R1C10']);
    expect(items.map((i) => [i.row, i.start, i.end, i.price])).toEqual([
      [1, 10, 10, 25],
      [7, 12, 12, 32],
      [15, 3, 4, 89],
    ]);
  });

  it('formats the show date', () => {
    expect(formatShowDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
  });
});

describe('screens', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(appRoutes), provideHttpClient(), provideHttpClientTesting(), provideNativeDateAdapter(), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } }],
    });
  });

  it('selects seats, enforces the cap and renders the panel', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SeatMap);
    http.expectOne('http://localhost:3000/screenings/1').flush({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: ['R3C7', 'R15C5'] });
    http.expectOne('http://localhost:3000/movies/1').flush({ id: 1, title: 'X', genre: 'Drama', runtimeMinutes: 1, format: 'PL dubbing' });
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const q = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${s}"]`));
    expect(q('seat').length).toBe(296);
    expect(q('couch').length).toBe(12);
    expect(el.querySelector('[data-testid="seat-map-subtitle"]')?.textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(q('seat').find((s) => s.dataset['row'] === '1' && s.dataset['column'] === '10')?.dataset['state']).toBe('accessible');
    expect(q('couch').find((s) => s.dataset['columnStart'] === '5')?.dataset['state']).toBe('unavailable');

    const click = async (e: HTMLElement | undefined) => {
      e?.click();
      await fixture.whenStable();
    };
    const seat = (r: number, c: number) => q('seat').find((s) => s.dataset['row'] === `${r}` && s.dataset['column'] === `${c}`);
    await click(seat(7, 12));
    await click(seat(7, 11));
    await click(q('couch').find((s) => s.dataset['columnStart'] === '1'));
    expect(el.querySelector('[data-testid="selected-seats-count"]')?.textContent).toBe('Selected seats: 4');
    expect(q('selected-seats-row').map((r) => r.textContent)).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    await click(seat(3, 7));
    expect(seat(3, 7)?.dataset['state']).toBe('unavailable');
    for (const c of [5, 6, 7, 8, 9, 10, 11]) await click(seat(5, c));
    expect(el.querySelector('[data-testid="selected-seats-count"]')?.textContent).toBe('Selected seats: 10');
    await click(seat(6, 5));
    expect(el.querySelector('[data-testid="selected-seats-count"]')?.textContent).toBe('Selected seats: 10');
    await click(seat(5, 5));
    expect(el.querySelector('[data-testid="selected-seats-count"]')?.textContent).toBe('Selected seats: 9');
    expect(TestBed.inject(BookingService).booking()?.seats.length).toBe(9);
  });

  it('validates the checkout form', async () => {
    const booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.setSeats(['R1C5', 'R15C1', 'R15C2']);
    const fixture = TestBed.createComponent(Checkout);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector<HTMLButtonElement>('[data-testid="pay-button"]');
    expect(btn?.textContent?.trim()).toBe('Pay 114.00 PLN');
    expect(el.querySelector('[data-testid="first-name-error"]')).toBeNull();
    btn?.click();
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="first-name-error"]')?.textContent).toBe('First name is required');
    expect(el.querySelector('[data-testid="confirm-email-error"]')?.textContent).toBe('Confirm email is required');
    expect(el.querySelector('[data-testid="terms-error"]')?.textContent).toBe('You must accept the terms and conditions');
    expect(el.querySelector('[data-testid="phone-error"]')).toBeNull();
    const type = async (id: string, v: string) => {
      const i = el.querySelector(`[data-testid="${id}"]`) as HTMLInputElement;
      i.value = v;
      i.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    await type('email-input', 'a@b');
    await type('confirm-email-input', 'x');
    await type('phone-input', '12345678a');
    expect(el.querySelector('[data-testid="email-error"]')?.textContent).toBe('Enter a valid email address');
    expect(el.querySelector('[data-testid="confirm-email-error"]')?.textContent).toBe('Email addresses do not match');
    expect(el.querySelector('[data-testid="phone-error"]')?.textContent).toBe('Phone number must be exactly 9 digits');
    await type('confirm-email-input', 'a@b');
    expect(el.querySelector('[data-testid="confirm-email-error"]')).toBeNull();
    expect(booking.booking()?.form.email).toBe('a@b');
  });
});
