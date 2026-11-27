import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from '../app.routes';
import { BookingService } from '../core/booking.service';

describe('SeatMap', () => {
  let harness: RouterTestingHarness;
  let root: HTMLElement;

  const text = (testId: string) =>
    [...root.querySelectorAll(`[data-testid="${testId}"]`)].map((e) => e.textContent?.trim());
  const el = (selector: string): HTMLElement => {
    const found = root.querySelector<HTMLElement>(selector);
    if (!found) {
      throw new Error(`No element for ${selector}`);
    }
    return found;
  };
  const click = async (selector: string) => {
    el(selector).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  };

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(appRoutes), provideHttpClient(), provideHttpClientTesting()],
    });
    harness = await RouterTestingHarness.create();
    const http = TestBed.inject(HttpTestingController);
    const navigation = harness.navigateByUrl('/screenings/1/seats');
    await vi.waitFor(() => http.expectOne('http://localhost:3000/screenings/1'), { timeout: 5000 }).then((req) =>
      req.flush({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: ['R3C7', 'R15C5', 'R15C6'] }),
    );
    http.expectOne('http://localhost:3000/movies/1').flush({ id: 1 });
    await navigation;
    harness.detectChanges();
    root = harness.routeNativeElement as HTMLElement;
  });

  it('renders the header and the auditorium', () => {
    expect(text('seat-map-subtitle')).toEqual(['Show Date: Tuesday 15 Sep 16:00']);
    expect(root.querySelectorAll('[data-testid="seat-row"]').length).toBe(15);
    expect(root.querySelectorAll('[data-testid="seat"], [data-testid="couch"]').length).toBe(308);
    expect(root.querySelectorAll('[data-testid="aisle"]').length).toBe(30);
    expect(el('[data-testid="seat"][data-row="3"][data-column="7"]').getAttribute('data-state')).toBe('unavailable');
    expect(el('[data-testid="couch"][data-column-start="5"]').getAttribute('data-state')).toBe('unavailable');
    expect(el('[data-testid="seat"][data-row="1"][data-column="12"]').getAttribute('data-state')).toBe('accessible');
  });

  it('selects seats and couches and lists them by row', async () => {
    await click('[data-testid="seat"][data-row="7"][data-column="12"]');
    await click('[data-testid="seat"][data-row="7"][data-column="11"]');
    await click('[data-testid="couch"][data-column-start="1"]');
    await click('[data-testid="seat"][data-row="3"][data-column="7"]');
    expect(text('selected-seats-count')).toEqual(['Selected seats: 4']);
    expect(text('selected-seats-row')).toEqual(['Row 7: 11, 12', 'Row 15: 1-2']);
    expect(TestBed.inject(BookingService).booking()?.seats).toEqual(['R7C12', 'R7C11', 'R15C1', 'R15C2']);
    await click('[data-testid="seat"][data-row="7"][data-column="12"]');
    expect(text('selected-seats-count')).toEqual(['Selected seats: 3']);
  });

  it('caps the booking at 10 seats with a toast', async () => {
    for (let column = 5; column <= 14; column++) {
      await click(`[data-testid="seat"][data-row="8"][data-column="${column}"]`);
    }
    expect(text('selected-seats-count')).toEqual(['Selected seats: 10']);
    await click('[data-testid="seat"][data-row="8"][data-column="15"]');
    expect(text('selected-seats-count')).toEqual(['Selected seats: 10']);
    await vi.waitFor(() =>
      expect(document.querySelector('[data-testid="toast"]')?.textContent).toContain('Maximum 10 seats per booking'),
    );
    await click('[data-testid="seat"][data-row="8"][data-column="5"]');
    expect(text('selected-seats-count')).toEqual(['Selected seats: 9']);
  });
});
