import { AUDITORIUM, describeTicket, formatPrice, ticketsOf, totalOf } from './seats';
import { parseIsoDate, showDate } from './dates';

describe('auditorium layout', () => {
  const cells = AUDITORIUM.flatMap((r) => r.items.filter((i) => i.type === 'cell'));

  it('has 308 selectable elements', () => {
    expect(cells.length).toBe(308);
    expect(cells.filter((i) => i.cell.kind === 'couch').length).toBe(12);
  });

  it('has two aisles in every row and an entrance gap in rows 1-10', () => {
    for (const row of AUDITORIUM) {
      expect(row.items.filter((i) => i.type === 'aisle').length).toBe(2);
      expect(row.items.some((i) => i.type === 'entrance')).toBe(row.row <= 10);
    }
  });

  it('marks six accessible seats in row 1', () => {
    const accessible = cells.filter((i) => i.cell.accessible).map((i) => `${i.cell.row}:${i.cell.column}`);
    expect(accessible).toEqual(['1:10', '1:11', '1:12', '1:13', '1:14', '1:15']);
  });
});

describe('tickets', () => {
  it('groups couch identifiers and prices them', () => {
    const tickets = ticketsOf(['R15C3', 'R15C4', 'R7C12', 'R1C10', 'R12C1']);
    expect(tickets.map((t) => `${t.row}:${describeTicket(t)}`)).toEqual(['1:10', '7:12', '12:1', '15:3-4']);
    expect(tickets.map((t) => t.price)).toEqual([25, 32, 39, 89]);
    expect(formatPrice(totalOf(tickets))).toBe('185.00 PLN');
  });
});

describe('dates', () => {
  it('formats the show date', () => {
    expect(showDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
  });

  it('rejects invalid ISO dates', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('15-09-2026')).toBeNull();
    expect(parseIsoDate('2026-09-15')).not.toBeNull();
  });
});
