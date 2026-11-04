import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from './core/api.service';
import { BookingService } from './core/booking.service';
import { Checkout } from './checkout/checkout';
import { SeatMap } from './seat-map/seat-map';

const screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: ['R3C7', 'R15C5', 'R15C6', 'R1C11'],
};

describe('screens', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ApiService, useValue: { screening: () => of(screening) } }],
    });
  });

  it('renders the seat map and handles selection', async () => {
    const fixture = TestBed.createComponent(SeatMap);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const q = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${s}"]`));
    expect(q('seat').length + q('couch').length).toBe(308);
    expect(q('couch').length).toBe(12);
    expect(q('aisle').length).toBe(30);
    expect(q('seat-row').length).toBe(15);
    expect(q('seat-map-subtitle')[0].textContent).toBe('Show Date: Tuesday 15 Sep 16:00');
    expect(q('seat').filter((s) => s.dataset['state'] === 'accessible').length).toBe(5);
    expect(q('seat').filter((s) => s.dataset['state'] === 'unavailable').length).toBe(2);
    expect(q('couch').filter((s) => s.dataset['state'] === 'unavailable').length).toBe(1);

    const seat = q('seat').find((s) => s.dataset['row'] === '7' && s.dataset['column'] === '12')!;
    seat.click();
    q('couch')[0].click();
    fixture.detectChanges();
    expect(seat.dataset['state']).toBe('selected');
    expect(q('selected-seats-count')[0].textContent).toBe('Selected seats: 3');
    expect(q('selected-seats-row').map((r) => r.textContent)).toEqual(['Row 7: 12', 'Row 15: 1-2']);
    expect(seat.textContent).toBe('12');
  });

  it('renders checkout and validates on pay', async () => {
    const booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.setSeats(['R7C12', 'R15C1', 'R15C2']);
    const fixture = TestBed.createComponent(Checkout);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const byId = (id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    expect(byId('pay-button')!.textContent).toBe('Pay 121.00 PLN');
    expect(byId('first-name-label')!.textContent).toContain('First name *');
    expect(byId('first-name-error')).toBeNull();
    byId('pay-button')!.click();
    fixture.detectChanges();
    expect(byId('first-name-error')!.textContent).toBe('First name is required');
    expect(byId('confirm-email-error')!.textContent).toBe('Confirm email is required');
    expect(byId('terms-error')!.textContent).toBe('You must accept the terms and conditions');
    expect(byId('phone-error')).toBeNull();
  });
});
