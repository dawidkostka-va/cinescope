import { formatPrice, parseIsoDate, showDate, ticketsFromSeats } from './seating';

describe('seating', () => {
  it('groups couch identifiers and prices tickets', () => {
    const tickets = ticketsFromSeats(['R15C4', 'R15C3', 'R7C12', 'R1C10', 'R12C1']);
    expect(tickets.map((t) => [t.row, t.columnStart, t.columnEnd, t.price])).toEqual([
      [1, 10, 10, 25],
      [7, 12, 12, 32],
      [12, 1, 1, 39],
      [15, 3, 4, 89],
    ]);
  });

  it('formats dates and prices', () => {
    expect(showDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
    expect(formatPrice(25)).toBe('25.00 PLN');
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('nope')).toBeNull();
  });
});
