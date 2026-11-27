import { AuditoriumCell, SeatCell, CouchCell, buildAuditorium, seatIdsOf } from './auditorium';

const seatsOf = (cells: AuditoriumCell[]) => cells.filter((cell): cell is SeatCell => cell.kind === 'seat');
const couchesOf = (cells: AuditoriumCell[]) => cells.filter((cell): cell is CouchCell => cell.kind === 'couch');

describe('buildAuditorium', () => {
  it('has 15 rows numbered 1 to 15', () => {
    expect(buildAuditorium([]).map((row) => row.row)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('has columns 5 to 24 in rows 1 to 10 and 1 to 24 in rows 11 to 14', () => {
    const rows = buildAuditorium([]);
    for (const { row, cells } of rows.slice(0, 10)) {
      const columns = seatsOf(cells).map((seat) => seat.column);
      expect(columns).toEqual(Array.from({ length: 20 }, (_, i) => i + 5));
      expect(row).toBeGreaterThan(0);
    }
    for (const { cells } of rows.slice(10, 14)) {
      expect(seatsOf(cells).map((seat) => seat.column)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    }
  });

  it('has 12 couches in row 15 covering 1-2 through 23-24', () => {
    const couches = couchesOf(buildAuditorium([])[14].cells);
    expect(couches.map((couch) => [couch.columnStart, couch.columnEnd])).toEqual(
      Array.from({ length: 12 }, (_, i) => [i * 2 + 1, i * 2 + 2]),
    );
    expect(seatsOf(buildAuditorium([])[14].cells)).toEqual([]);
  });

  it('has two aisles in every row', () => {
    for (const { cells } of buildAuditorium([])) {
      expect(cells.filter((cell) => cell.kind === 'aisle')).toHaveLength(2);
    }
  });

  it('has 308 selectable elements', () => {
    const cells = buildAuditorium([]).flatMap((row) => row.cells);
    expect(seatsOf(cells).length + couchesOf(cells).length).toBe(308);
    expect(couchesOf(cells).length).toBe(12);
  });

  it('keeps each column at the same grid position in every row', () => {
    const positions = new Map<number, Set<string>>();
    for (const { cells } of buildAuditorium([])) {
      for (const seat of seatsOf(cells)) {
        positions.set(seat.column, (positions.get(seat.column) ?? new Set()).add(seat.gridColumn));
      }
    }
    for (const [, placements] of positions) {
      expect(placements.size).toBe(1);
    }
  });

  it('marks accessible seats in row 1, columns 10 to 15', () => {
    const accessible = seatsOf(buildAuditorium([])[0].cells).filter((seat) => seat.state === 'accessible');
    expect(accessible.map((seat) => seat.column)).toEqual([10, 11, 12, 13, 14, 15]);
  });

  it('marks occupied seats and couches with either seat occupied as unavailable', () => {
    const rows = buildAuditorium(['R3C7', 'R15C6']);
    expect(seatsOf(rows[2].cells).find((seat) => seat.column === 7)?.state).toBe('unavailable');
    expect(seatsOf(rows[2].cells).find((seat) => seat.column === 8)?.state).toBe('available');
    const couches = couchesOf(rows[14].cells);
    expect(couches.find((couch) => couch.columnStart === 5)?.state).toBe('unavailable');
    expect(couches.find((couch) => couch.columnStart === 1)?.state).toBe('available');
  });

  it('never marks couches as accessible', () => {
    const couches = couchesOf(buildAuditorium([])[14].cells);
    expect(couches.every((couch) => couch.state === 'available')).toBe(true);
  });

  it('marks selected seats and couches as selected, occupied ones staying unavailable', () => {
    const rows = buildAuditorium(['R3C7'], new Set(['R3C7', 'R3C8', 'R1C10', 'R15C3', 'R15C4']));
    expect(seatsOf(rows[2].cells).find((seat) => seat.column === 8)?.state).toBe('selected');
    expect(seatsOf(rows[2].cells).find((seat) => seat.column === 7)?.state).toBe('unavailable');
    expect(seatsOf(rows[0].cells).find((seat) => seat.column === 10)?.state).toBe('selected');
    const couches = couchesOf(rows[14].cells);
    expect(couches.find((couch) => couch.columnStart === 3)?.state).toBe('selected');
    expect(couches.find((couch) => couch.columnStart === 1)?.state).toBe('available');
  });
});

describe('seatIdsOf', () => {
  it('returns the identifier of a seat', () => {
    const seat = seatsOf(buildAuditorium([])[6].cells).find((cell) => cell.column === 12) as SeatCell;
    expect(seatIdsOf(seat)).toEqual(['R7C12']);
  });

  it('returns both identifiers of a couch', () => {
    const couch = couchesOf(buildAuditorium([])[14].cells).find((cell) => cell.columnStart === 5) as CouchCell;
    expect(seatIdsOf(couch)).toEqual(['R15C5', 'R15C6']);
  });
});
