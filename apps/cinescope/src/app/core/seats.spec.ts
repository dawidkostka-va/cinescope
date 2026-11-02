import { formatShowDate, parseIsoDate } from './dates';
import { buildRows, formatPrice, selectionByRow, ticketsFromSeats } from './seats';

describe('seat layout', () => {
  const rows = buildRows(new Set(), new Set());
  const cells = rows.flatMap((r) => r.blocks.flatMap((b) => b.cells));

  it('has 308 selectable elements', () => {
    expect(cells.length).toBe(308);
    expect(cells.filter((c) => c.kind === 'couch').length).toBe(12);
    expect(rows.slice(0, 10).flatMap((r) => r.blocks.flatMap((b) => b.cells)).length).toBe(200);
  });

  it('starts rows 1-10 at column 5', () => {
    for (const row of rows.slice(0, 10)) {
      expect(row.blocks[0].cells.length).toBe(0);
      expect(row.blocks[1].cells[0]).toMatchObject({ column: 5 });
    }
  });

  it('marks six accessible seats in row 1', () => {
    expect(cells.filter((c) => c.state === 'accessible').map((c) => c.row)).toEqual(
      Array(6).fill(1),
    );
  });

  it('treats a couch as unavailable when one of its seats is occupied', () => {
    const couch = buildRows(new Set(['R15C6']), new Set())[14].blocks[0].cells;
    expect(couch.map((c) => c.state)).toEqual(['available', 'available']);
    const all = buildRows(new Set(['R15C6']), new Set())[14].blocks[1].cells;
    expect(all[0].state).toBe('unavailable');
  });

  it('prices and groups tickets', () => {
    const tickets = ticketsFromSeats(['R15C1', 'R15C2', 'R7C12', 'R7C11', 'R1C10']);
    expect(tickets.map((t) => t.price)).toEqual([25, 32, 32, 89]);
    expect(selectionByRow(tickets).map((r) => r.text)).toEqual([
      'Row 1: 10',
      'Row 7: 11, 12',
      'Row 15: 1-2',
    ]);
    expect(formatPrice(121)).toBe('121.00 PLN');
  });
});

describe('dates', () => {
  it('formats the show date', () => {
    expect(formatShowDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
  });

  it('rejects invalid iso dates', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('15-09-2026')).toBeNull();
    expect(parseIsoDate('2026-09-15')).not.toBeNull();
  });
});
