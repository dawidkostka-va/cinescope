import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BookingStore } from '../booking';
import { SeatsPage } from './seats-page';

describe('SeatsPage', () => {
  async function open(occupied: string[]) {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(SeatsPage);
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('http://localhost:3000/screenings/1')
      .flush({ id: 1, movieId: 1, date: '2026-09-15', time: '16:00', occupiedSeats: occupied });
    http.expectOne('http://localhost:3000/movies/1').flush({ id: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const all = (el: HTMLElement, id: string) =>
    Array.from(el.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('draws the auditorium', async () => {
    const el = await open(['R3C7', 'R15C5']);
    expect(all(el, 'seat-row').length).toBe(15);
    expect(all(el, 'seat').length + all(el, 'couch').length).toBe(308);
    expect(all(el, 'couch').length).toBe(12);
    expect(all(el, 'aisle').length).toBe(30);
    expect(el.querySelector('[data-testid="seat-map-subtitle"]')?.textContent).toContain(
      'Show Date: Tuesday 15 Sep 16:00',
    );
    expect(
      all(el, 'seat').filter((s) => s.dataset['row'] === '1' && s.dataset['state'] === 'accessible')
        .length,
    ).toBe(6);
    const rowOne = all(el, 'seat-row')[0];
    expect(rowOne.querySelectorAll('[data-testid="seat"]').length).toBe(20);
    expect(rowOne.querySelector<HTMLElement>('[data-testid="seat"]')?.textContent).toBe(
      '5',
    );
    const couch = all(el, 'couch').find((c) => c.dataset['columnStart'] === '5');
    expect(couch?.dataset['state']).toBe('unavailable');
  });

  it('selects, caps and lists seats', async () => {
    const el = await open([]);
    const fixture = TestBed.inject(BookingStore);
    const seat = (row: number, col: number) =>
      all(el, 'seat').find(
        (s) => s.dataset['row'] === `${row}` && s.dataset['column'] === `${col}`,
      )!;
    seat(7, 11).click();
    seat(7, 12).click();
    all(el, 'couch')[0].click();
    expect(fixture.items().length).toBe(3);
    for (const c of [2, 3, 4]) all(el, 'couch')[c].click();
    expect(fixture.items().length).toBe(6);
    seat(7, 13).click();
    seat(7, 14).click();
    expect(fixture.items().length).toBe(6);
    all(el, 'couch')[0].click();
    expect(fixture.items().length).toBe(5);
  });
});
