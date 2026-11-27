import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../api.service';
import { bookingGuard } from '../booking';
import { Movie, Screening } from '../models';
import { SeatSelection } from '../seat-selection/seat-selection';
import { Summary } from './summary';

const movie: Movie = {
  id: 1,
  title: 'The Silent Harbor',
  genre: 'Drama',
  runtimeMinutes: 128,
  format: 'PL subtitles',
};

const screening: Screening = {
  id: 1,
  movieId: 1,
  date: '2026-09-15',
  time: '16:00',
  occupiedSeats: [],
};

@Component({ template: '' })
class Home {}

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class Host {}

function createApi() {
  return {
    getScreening: vi.fn((id: string): Observable<Screening> => {
      return id === '1' ? of(screening) : throwError(() => new Error('404'));
    }),
    getMovie: vi.fn((): Observable<Movie> => of(movie)),
  };
}

function storeBooking(seats: string[], screeningId = 1): void {
  sessionStorage.setItem('cinescope.booking', JSON.stringify({ screeningId, seats }));
}

async function settle(fixture: ComponentFixture<Host>): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
}

function queryAll(fixture: ComponentFixture<Host>, testId: string): HTMLElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      `[data-testid="${testId}"]`,
    ),
  );
}

function query(fixture: ComponentFixture<Host>, testId: string): HTMLElement | null {
  return queryAll(fixture, testId)[0] ?? null;
}

function text(el: HTMLElement | null | undefined): string | undefined {
  return el?.textContent?.trim();
}

async function open(
  url: string,
  api: ReturnType<typeof createApi>,
): Promise<ComponentFixture<Host>> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', component: Home },
        { path: 'screenings/:id/seats', component: SeatSelection },
        { path: 'screenings/:id/summary', component: Summary, canActivate: [bookingGuard] },
        { path: 'screenings/:id/checkout', component: Home, canActivate: [bookingGuard] },
      ]),
      { provide: ApiService, useValue: api },
    ],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await TestBed.inject(Router).navigateByUrl(url);
  await settle(fixture);
  return fixture;
}

describe('Summary', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows the title, one item per ticket with its details, and the total', async () => {
    storeBooking(['R15C5', 'R15C6', 'R7C12', 'R1C10']);
    const fixture = await open('/screenings/1/summary', createApi());

    expect(text(query(fixture, 'summary-title'))).toBe('Your tickets');
    const items = queryAll(fixture, 'summary-item');
    expect(items.length).toBe(3);
    const field = (item: HTMLElement, testId: string) =>
      text(item.querySelector<HTMLElement>(`[data-testid="${testId}"]`));

    expect(items.map((item) => field(item, 'summary-item-title'))).toEqual([
      'The Silent Harbor',
      'The Silent Harbor',
      'The Silent Harbor',
    ]);
    expect(items.map((item) => field(item, 'summary-item-datetime'))).toEqual([
      '2026-09-15 16:00',
      '2026-09-15 16:00',
      '2026-09-15 16:00',
    ]);
    expect(items.map((item) => field(item, 'summary-item-row'))).toEqual(['1', '7', '15']);
    expect(items.map((item) => field(item, 'summary-item-seat'))).toEqual([
      '10',
      '12',
      'Couch 5-6',
    ]);
    expect(items.map((item) => field(item, 'summary-item-price'))).toEqual([
      '25.00 PLN',
      '32.00 PLN',
      '89.00 PLN',
    ]);
    expect(text(query(fixture, 'summary-total'))).toBe('Total: 146.00 PLN');
  });

  it('prices rows 1-5, 6-10 and 11-14 and counts a couch once', async () => {
    storeBooking(['R5C1', 'R6C1', 'R11C1', 'R15C1', 'R15C2']);
    const fixture = await open('/screenings/1/summary', createApi());

    expect(queryAll(fixture, 'summary-item-price').map((el) => text(el))).toEqual([
      '25.00 PLN',
      '32.00 PLN',
      '39.00 PLN',
      '89.00 PLN',
    ]);
    expect(text(query(fixture, 'summary-total'))).toBe('Total: 185.00 PLN');
  });

  it('Remove takes the ticket out of the booking and updates the total', async () => {
    storeBooking(['R1C10', 'R7C12', 'R15C5', 'R15C6']);
    const fixture = await open('/screenings/1/summary', createApi());

    queryAll(fixture, 'summary-item-remove-button')[0]?.click();
    await settle(fixture);

    expect(queryAll(fixture, 'summary-item').length).toBe(2);
    expect(text(query(fixture, 'summary-total'))).toBe('Total: 121.00 PLN');
    expect(JSON.parse(sessionStorage.getItem('cinescope.booking') ?? 'null')).toEqual({
      screeningId: 1,
      seats: ['R7C12', 'R15C5', 'R15C6'],
    });
    expect(TestBed.inject(Router).url).toBe('/screenings/1/summary');
  });

  it('removing the last ticket opens the seat map', async () => {
    storeBooking(['R1C10']);
    const fixture = await open('/screenings/1/summary', createApi());

    queryAll(fixture, 'summary-item-remove-button')[0]?.click();
    await settle(fixture);

    expect(TestBed.inject(Router).url).toBe('/screenings/1/seats');
    expect(JSON.parse(sessionStorage.getItem('cinescope.booking') ?? 'null')).toEqual({
      screeningId: 1,
      seats: [],
    });
  });

  it('Back returns to the seat map with the selection intact', async () => {
    storeBooking(['R7C12', 'R15C5', 'R15C6']);
    const fixture = await open('/screenings/1/summary', createApi());

    query(fixture, 'back-button')?.click();
    await settle(fixture);

    expect(TestBed.inject(Router).url).toBe('/screenings/1/seats');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLElement>('[data-testid="selected-seats-count"]')
        ?.textContent?.trim(),
    ).toBe('Selected seats: 3');
  });

  it('Confirm opens the checkout', async () => {
    storeBooking(['R7C12']);
    const fixture = await open('/screenings/1/summary', createApi());

    query(fixture, 'confirm-button')?.click();
    await settle(fixture);

    expect(TestBed.inject(Router).url).toBe('/screenings/1/checkout');
  });

  it('keeps the listed tickets after a reload of the summary', async () => {
    storeBooking(['R7C12', 'R15C5', 'R15C6']);
    const fixture = await open('/screenings/1/summary', createApi());
    expect(queryAll(fixture, 'summary-item').length).toBe(2);

    await TestBed.inject(Router).navigateByUrl('/');
    await settle(fixture);
    await TestBed.inject(Router).navigateByUrl('/screenings/1/summary');
    await settle(fixture);

    expect(queryAll(fixture, 'summary-item').length).toBe(2);
    expect(text(query(fixture, 'summary-total'))).toBe('Total: 121.00 PLN');
  });

  it('redirects to / without a booking for the screening', async () => {
    const fixture = await open('/screenings/1/summary', createApi());

    expect(TestBed.inject(Router).url).toBe('/');
    expect(query(fixture, 'summary-title')).toBeNull();
  });

  it('redirects to / when the booking belongs to another screening', async () => {
    storeBooking(['R7C12'], 2);
    await open('/screenings/1/summary', createApi());

    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('redirects to / when the screening cannot be loaded', async () => {
    storeBooking(['R7C12'], 99);
    const fixture = await open('/screenings/99/summary', createApi());

    expect(TestBed.inject(Router).url).toBe('/');
    expect(query(fixture, 'summary-title')).toBeNull();
  });
});
