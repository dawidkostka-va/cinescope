import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BookingService } from '../core/booking.service';
import { Summary } from './summary';

@Component({ template: '' })
class Blank {}

describe('Summary', () => {
  beforeEach(() => sessionStorage.clear());

  it('lists tickets, totals them and returns to the seat map after the last removal', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'screenings/:id/summary', component: Summary },
          { path: 'screenings/:id/seats', component: Blank },
        ]),
      ],
    });
    const booking = TestBed.inject(BookingService);
    booking.start(1);
    booking.setItems(['R15C3', 'R7C12', 'R1C10']);
    const http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/screenings/1/summary');
    http.expectOne('http://localhost:3000/screenings/1').flush({
      id: 1,
      movieId: 1,
      date: '2026-09-15',
      time: '16:00',
      occupiedSeats: [],
    });
    http.expectOne('http://localhost:3000/movies/1').flush({ id: 1, title: 'The Silent Harbor' });
    harness.detectChanges();
    const el: HTMLElement = harness.fixture.nativeElement;
    const all = (id: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
    const text = (id: string) => all(id).map((e) => e.textContent);

    expect(text('summary-item-seat')).toEqual(['10', '12', 'Couch 3-4']);
    expect(text('summary-item-price')).toEqual(['25.00 PLN', '32.00 PLN', '89.00 PLN']);
    expect(text('summary-item-row')).toEqual(['1', '7', '15']);
    expect(text('summary-item-datetime')[0]).toBe('2026-09-15 16:00');
    expect(text('summary-total')).toEqual(['Total: 146.00 PLN']);

    all('summary-item-remove-button')[2].click();
    harness.detectChanges();
    expect(text('summary-total')).toEqual(['Total: 57.00 PLN']);

    all('summary-item-remove-button').forEach((b) => b.click());
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/screenings/1/seats');
    expect(booking.booking()?.items).toEqual([]);
  });
});
