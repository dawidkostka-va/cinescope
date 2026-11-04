import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking.service';
import { formatShowDate, parseIso } from './dates';
import { buildRows, formatPrice, gridTrack, ticketsFromSeats } from './seats';

describe('dates', () => {
  it('parses only valid ISO dates', () => {
    expect(parseIso('2026-09-15')?.getDate()).toBe(15);
    expect(parseIso('2026-02-30')).toBeNull();
    expect(parseIso('15-09-2026')).toBeNull();
    expect(parseIso(null)).toBeNull();
  });

  it('formats the show date', () => {
    expect(formatShowDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
  });
});

describe('seats', () => {
  it('builds 308 selectable elements', () => {
    const rows = buildRows();
    expect(rows.length).toBe(15);
    expect(rows.flatMap((r) => r.cells).length).toBe(308);
    expect(rows[0].cells[0].col).toBe(5);
    expect(rows[10].cells[0].col).toBe(1);
  });

  it('places columns around the aisles', () => {
    expect([gridTrack(4), gridTrack(5), gridTrack(20), gridTrack(21)]).toEqual([5, 7, 22, 24]);
  });

  it('groups couches and prices tickets', () => {
    const tickets = ticketsFromSeats(['R15C2', 'R15C1', 'R7C12', 'R1C10', 'R12C3']);
    expect(tickets.map((t) => [t.row, t.colStart, t.colEnd, t.couch, t.price])).toEqual([
      [1, 10, 10, false, 25],
      [7, 12, 12, false, 32],
      [12, 3, 3, false, 39],
      [15, 1, 2, true, 89],
    ]);
    expect(formatPrice(25)).toBe('25.00 PLN');
  });
});

describe('BookingService', () => {
  beforeEach(() => sessionStorage.clear());

  it('persists and clears the booking', () => {
    const service = TestBed.inject(BookingService);
    service.start(3);
    service.setSeats(['R15C2', 'R15C1', 'R7C12']);
    expect(service.total()).toBe(121);
    expect(JSON.parse(sessionStorage.getItem('cinescope.booking') ?? '{}').seats).toEqual(['R7C12', 'R15C1', 'R15C2']);
    service.clear();
    expect(sessionStorage.getItem('cinescope.booking')).toBeNull();
  });
});
