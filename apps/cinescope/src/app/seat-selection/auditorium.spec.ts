import { AuditoriumRow, RowSegment, SeatCell, buildAuditorium, seatId } from './auditorium';

function blocksOf(row: AuditoriumRow): SeatCell[][] {
  return row.segments
    .filter((segment): segment is Extract<RowSegment, { kind: 'block' }> => segment.kind === 'block')
    .map((segment) => segment.cells);
}

function allCells(rows: AuditoriumRow[]): SeatCell[] {
  return rows.flatMap((row) => blocksOf(row).flat());
}

describe('buildAuditorium', () => {
  const rows = buildAuditorium([]);

  it('has 15 rows numbered 1 to 15', () => {
    expect(rows.map((row) => row.number)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('has 308 selectable elements: 200 seats in rows 1-10, 96 in rows 11-14, 12 couches in row 15', () => {
    const cells = allCells(rows);
    const count = (row: number[], kind: SeatCell['kind']) =>
      cells.filter((cell) => cell.kind === kind && row.includes(cell.row)).length;
    expect(count([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'seat')).toBe(200);
    expect(count([11, 12, 13, 14], 'seat')).toBe(96);
    expect(count([15], 'couch')).toBe(12);
    expect(cells.length).toBe(308);
  });

  it('renders columns 5-24 only in rows 1-10 and columns 1-24 in rows 11-15, with an empty entrance', () => {
    for (const row of rows) {
      const leftFirst = row.segments[0];
      if (row.number <= 10) {
        expect(leftFirst.kind).toBe('entrance');
      } else {
        expect(leftFirst.kind).toBe('block');
      }
      const columns = blocksOf(row).flat().flatMap((cell) =>
        Array.from({ length: cell.columnEnd - cell.column + 1 }, (_, i) => cell.column + i),
      );
      const expected = row.number <= 10 ? 20 : 24;
      expect(columns.length).toBe(expected);
      expect(Math.min(...columns)).toBe(row.number <= 10 ? 5 : 1);
      expect(Math.max(...columns)).toBe(24);
    }
  });

  it('places both aisles in every row, between columns 4-5 and 20-21', () => {
    for (const row of rows) {
      const kinds = row.segments.map((segment) => segment.kind);
      expect(kinds).toEqual([expect.any(String), 'aisle', 'block', 'aisle', 'block']);
      expect(kinds.filter((kind) => kind === 'aisle').length).toBe(2);
    }
  });

  it('has 6 accessible seats in row 1, columns 10 to 15', () => {
    const accessible = allCells(rows).filter((cell) => cell.state === 'accessible');
    expect(accessible.map((cell) => `${cell.row}:${cell.column}`)).toEqual(
      ['10', '11', '12', '13', '14', '15'].map((column) => `1:${column}`),
    );
  });

  it('renders row 15 as 12 couches covering columns 1-2 through 23-24', () => {
    const couches = allCells(rows).filter((cell) => cell.row === 15);
    expect(couches.every((cell) => cell.kind === 'couch')).toBe(true);
    expect(couches.map((cell) => `${cell.column}-${cell.columnEnd}`)).toEqual(
      Array.from({ length: 12 }, (_, i) => `${i * 2 + 1}-${i * 2 + 2}`),
    );
  });

  it('marks occupied seats unavailable and a couch unavailable when either of its seats is occupied', () => {
    const occupied = buildAuditorium([seatId(3, 7), seatId(1, 10), seatId(15, 6)]);
    const cells = allCells(occupied);
    const find = (row: number, column: number) =>
      cells.find((cell) => cell.row === row && cell.column === column);
    expect(find(3, 7)?.state).toBe('unavailable');
    expect(find(1, 10)?.state).toBe('unavailable');
    expect(find(15, 5)?.state).toBe('unavailable');
    expect(find(15, 7)?.state).toBe('available');
    expect(find(3, 8)?.state).toBe('available');
  });
});
