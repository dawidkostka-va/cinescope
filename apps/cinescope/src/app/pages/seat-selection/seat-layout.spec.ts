import { describe, expect, it } from 'vitest';
import { buildAuditoriumRows, SeatCell } from './seat-layout';

function isSeat(cell: SeatCell): cell is Extract<SeatCell, { kind: 'seat' }> {
  return cell.kind === 'seat';
}

describe('buildAuditoriumRows', () => {
  const rows = buildAuditoriumRows();

  it('has 15 rows', () => {
    expect(rows).toHaveLength(15);
  });

  it('has 308 selectable elements in total (seats + couches)', () => {
    const total = rows.reduce((sum, row) => sum + row.cells.filter((c) => c.kind === 'seat' || c.kind === 'couch').length, 0);
    expect(total).toBe(308);
  });

  it('rows 1-10 have 20 seats each (columns 5-24)', () => {
    for (const row of rows.slice(0, 10)) {
      const seats = row.cells.filter(isSeat);
      expect(seats).toHaveLength(20);
      expect(Math.min(...seats.map((s) => s.column))).toBe(5);
      expect(Math.max(...seats.map((s) => s.column))).toBe(24);
    }
  });

  it('rows 11-14 have 24 seats each', () => {
    for (const row of rows.slice(10, 14)) {
      expect(row.cells.filter((c) => c.kind === 'seat')).toHaveLength(24);
    }
  });

  it('row 15 has 12 couches and no seats', () => {
    const row15 = rows[14];
    expect(row15.cells.filter((c) => c.kind === 'couch')).toHaveLength(12);
    expect(row15.cells.filter((c) => c.kind === 'seat')).toHaveLength(0);
  });

  it('row 1 marks columns 10-15 as accessible', () => {
    const row1 = rows[0];
    const accessible = row1.cells.filter(isSeat).filter((c) => c.accessible);
    expect(accessible.map((c) => c.column).sort((a, b) => a - b)).toEqual([10, 11, 12, 13, 14, 15]);
  });

  it('every row has exactly two aisles', () => {
    for (const row of rows) {
      expect(row.cells.filter((c) => c.kind === 'aisle')).toHaveLength(2);
    }
  });
});
