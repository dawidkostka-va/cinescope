import { AuditoriumCell, buildAuditorium, CouchCell, SeatCell } from './auditorium';

const rows = buildAuditorium();
const cellsOf = (row: number) => rows[row - 1].cells;
const seatsOf = (row: number) =>
  cellsOf(row).filter((cell): cell is SeatCell => cell.kind === 'seat');
const couchesOf = (row: number) =>
  cellsOf(row).filter((cell): cell is CouchCell => cell.kind === 'couch');

describe('buildAuditorium', () => {
  it('has 15 rows numbered 1 to 15', () => {
    expect(rows.map((row) => row.row)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('starts at column 5 in rows 1 to 10 and covers columns 1 to 24 in rows 11 to 15', () => {
    for (let row = 1; row <= 10; row++) {
      expect(seatsOf(row).map((seat) => seat.column)).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 5),
      );
    }
    for (let row = 11; row <= 14; row++) {
      expect(seatsOf(row).map((seat) => seat.column)).toEqual(
        Array.from({ length: 24 }, (_, i) => i + 1),
      );
    }
  });

  it('has two aisles in every row and an entrance gap only in rows 1 to 10', () => {
    for (const row of rows) {
      expect(row.cells.filter((cell) => cell.kind === 'aisle')).toHaveLength(2);
    }
    for (const row of rows) {
      const entrances = row.cells.filter((cell) => cell.kind === 'entrance');
      expect(entrances).toHaveLength(row.row <= 10 ? 1 : 0);
    }
  });

  it('marks row 1 columns 10 to 15 as accessible', () => {
    const accessible = seatsOf(1)
      .filter((seat) => seat.accessible)
      .map((seat) => seat.column);
    expect(accessible).toEqual([10, 11, 12, 13, 14, 15]);
    expect(rows.slice(1).every((row) => seatsOf(row.row).every((seat) => !seat.accessible))).toBe(
      true,
    );
  });

  it('renders 12 couches in row 15, each two adjacent columns', () => {
    const couches = couchesOf(15);
    expect(couches).toHaveLength(12);
    expect(couches.map((couch) => [couch.columnStart, couch.columnEnd])).toEqual(
      Array.from({ length: 12 }, (_, i) => [i * 2 + 1, i * 2 + 2]),
    );
    expect(seatsOf(15)).toHaveLength(0);
  });

  it('has 308 selectable elements in total', () => {
    const selectable = rows
      .flatMap((row) => row.cells)
      .filter((cell: AuditoriumCell) => cell.kind === 'seat' || cell.kind === 'couch');
    expect(selectable).toHaveLength(308);
    expect(rows.flatMap((row) => seatsOf(row.row)).length).toBe(296);
  });
});
