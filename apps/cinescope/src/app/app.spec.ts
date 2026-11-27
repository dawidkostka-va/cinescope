import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { App } from './app';
import { appRoutes } from './app.routes';
import { BookingService } from './booking.service';
import { itemsFromSeats, showDate } from './seat-utils';

const screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R1C12'],
};
const movie = {
  id: 1,
  title: 'The Silent Harbor',
  genre: 'Drama',
  runtimeMinutes: 128,
  format: 'PL subtitles',
};

function setup() {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter(appRoutes),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNativeDateAdapter(),
    ],
  });
  return { http: TestBed.inject(HttpTestingController), router: TestBed.inject(Router) };
}

async function settle(harness: RouterTestingHarness) {
  await harness.fixture.whenStable();
  harness.detectChanges();
}

describe('App', () => {
  it('should create', () => {
    setup();
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('formats show dates and groups couches', () => {
    expect(showDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
    const items = itemsFromSeats(['R15C2', 'R15C1', 'R7C12', 'R1C10']);
    expect(items.map((i) => [i.row, i.colStart, i.colEnd, i.price])).toEqual([
      [1, 10, 10, 25],
      [7, 12, 12, 32],
      [15, 1, 2, 89],
    ]);
  });

  it('draws the auditorium and selects seats', async () => {
    const { http } = setup();
    const harness = await RouterTestingHarness.create();
    const nav = harness.navigateByUrl('/screenings/1/seats');
    (await vi.waitFor(() => http.expectOne('http://localhost:3000/screenings/1'))).flush(screening);
    (await vi.waitFor(() => http.expectOne('http://localhost:3000/movies/1'))).flush(movie);
    await nav;
    await settle(harness);
    const el: HTMLElement = harness.routeNativeElement!;
    const q = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${s}"]`));
    expect(q('seat-row').length).toBe(15);
    expect(q('seat').length + q('couch').length).toBe(308);
    expect(q('couch').length).toBe(12);
    expect(q('aisle').length).toBe(30);
    expect(q('row-label-left').length).toBe(15);
    expect(
      q('seat').filter((s) => s.dataset['row'] === '1' && s.dataset['state'] === 'accessible')
        .length,
    ).toBe(5);
    expect(
      q('seat').find((s) => s.dataset['row'] === '1' && s.dataset['column'] === '12')!.dataset[
        'state'
      ],
    ).toBe('unavailable');
    expect(q('couch').find((s) => s.dataset['columnStart'] === '5')!.dataset['state']).toBe(
      'unavailable',
    );
    expect(q('seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    const seat = (r: number, c: number) =>
      q('seat').find((s) => s.dataset['row'] === `${r}` && s.dataset['column'] === `${c}`)!;
    seat(7, 12).click();
    seat(7, 11).click();
    q('couch')[0].click();
    seat(3, 7).click();
    harness.detectChanges();
    expect(q('selected-seats-count')[0].textContent).toBe('Selected seats: 4');
    expect(q('selected-seats-row').map((r) => r.textContent)).toEqual([
      'Row 7: 11, 12',
      'Row 15: 1-2',
    ]);
    expect(seat(7, 12).dataset['state']).toBe('selected');
    expect(getComputedStyle(seat(7, 12)).backgroundColor).toBe('rgb(249, 168, 37)');
    for (let c = 5; c < 12; c++) seat(8, c).click();
    for (let c = 5; c < 9; c++) seat(9, c).click();
    harness.detectChanges();
    expect(q('selected-seats-count')[0].textContent).toBe('Selected seats: 10');
    q('couch')[1].click();
    harness.detectChanges();
    expect(q('selected-seats-count')[0].textContent).toBe('Selected seats: 10');
    expect(document.querySelector('[data-testid="toast"]')?.textContent).toBe(
      'Maximum 10 seats per booking',
    );
    http.verify();
  });

  it('redirects guarded routes without a booking and validates checkout', async () => {
    const { http, router } = setup();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/screenings/1/checkout');
    expect(router.url).toBe('/');
    http.expectOne('http://localhost:3000/movies').flush([movie]);
    http.expectOne('http://localhost:3000/screenings').flush([screening]);
    await harness.navigateByUrl('/confirmation');
    expect(router.url).toBe('/');
    http.match(() => true);

    const booking = TestBed.inject(BookingService);
    booking.startFor(1);
    booking.setSeats(['R7C12', 'R15C1', 'R15C2']);
    await harness.navigateByUrl('/screenings/1/checkout');
    const el: HTMLElement = harness.routeNativeElement!;
    const byId = (id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    expect(byId('pay-button')!.textContent!.trim()).toBe('Pay 121.00 PLN');
    expect(byId('first-name-error')).toBeNull();
    byId('pay-button')!.click();
    await settle(harness);
    expect(byId('first-name-error')!.textContent).toBe('First name is required');
    expect(byId('confirm-email-error')!.textContent).toBe('Confirm email is required');
    expect(byId('terms-error')!.textContent).toBe('You must accept the terms and conditions');
    expect(byId('phone-error')).toBeNull();
    expect(document.querySelector('[data-testid="toast"]')?.textContent).toBe(
      'The form contains errors',
    );
    expect(router.url).toBe('/screenings/1/checkout');

    const type = async (id: string, value: string) => {
      const input = byId(id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      await settle(harness);
    };
    await type('email-input', 'anna@example.com');
    await type('confirm-email-input', 'anna@example.org');
    expect(byId('confirm-email-error')!.textContent).toBe('Email addresses do not match');
    await type('email-input', 'anna@example.org');
    expect(byId('confirm-email-error')).toBeNull();
    await type('phone-input', '12345');
    expect(byId('phone-error')!.textContent).toBe('Phone number must be exactly 9 digits');
    await type('first-name-input', 'A');
    expect(byId('first-name-error')!.textContent).toBe('First name must be at least 2 characters');
    expect(booking.booking()!.form.email).toBe('anna@example.org');

    await type('first-name-input', 'Anna');
    await type('last-name-input', 'Kowalska');
    await type('phone-input', '123456789');
    (byId('terms-checkbox')!.querySelector('input') as HTMLInputElement).click();
    await settle(harness);
    byId('pay-button')!.click();
    await settle(harness);
    const req = http.expectOne('http://localhost:3000/reservations');
    expect(req.request.body).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C1', 'R15C2'],
      customer: {
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna@example.org',
        phone: '123456789',
      },
      totalPrice: 121,
    });
    expect(byId('pay-button')!.textContent!.trim()).toBe('Processing…');
    expect((byId('pay-button') as HTMLButtonElement).disabled).toBe(true);
    req.flush({ id: 1 });
    await settle(harness);
    await harness.fixture.whenStable();
    expect(router.url).toBe('/confirmation');
    expect(booking.booking()!.paid).toBe(true);
  });
});
