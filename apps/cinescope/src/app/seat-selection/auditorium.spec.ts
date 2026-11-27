import { AuditoriumRow, SeatCell, buildAuditorium } from './auditorium';

function seatsOf(rows: AuditoriumRow[]): SeatCell[] {
  return rows.flatMap((row) => row.cells.filter((cell): cell is SeatCell => cell.kind === 'seat'));
}

describe('buildAuditorium', () => {
  it('has 15 rows numbered 1 to 15', () => {
    const rows = buildAuditorium([]);
    expect(rows.map((row) => row.row)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('has 296 seats and 12 couches, 308 selectable elements in total', () => {
    const rows = buildAuditorium([]);
    const couches = rows.flatMap((row) => row.cells.filter((cell) => cell.kind === 'couch'));
    expect(seatsOf(rows)).toHaveLength(296);
    expect(couches).toHaveLength(12);
    expect(seatsOf(rows).length + couches.length).toBe(308);
  });

  it('starts rows 1 to 10 at column 5 and rows 11 to 14 at column 1', () => {
    const rows = buildAuditorium([]);
    const firstColumn = (row: number) => seatsOf([rows[row - 1]])[0].column;
    expect(firstColumn(1)).toBe(5);
    expect(firstColumn(10)).toBe(5);
    expect(firstColumn(11)).toBe(1);
    expect(firstColumn(14)).toBe(1);
  });

  it('has two aisles in every row and no seat or number inside them', () => {
    for (const row of buildAuditorium([])) {
      expect(row.cells.filter((cell) => cell.kind === 'aisle')).toHaveLength(2);
    }
  });

  it('marks the six accessible seats in row 1 and no others', () => {
    const accessible = seatsOf(buildAuditorium([])).filter((seat) => seat.state === 'accessible');
    expect(accessible.map((seat) => `${seat.row}:${seat.column}`)).toEqual([
      '1:10',
      '1:11',
      '1:12',
      '1:13',
      '1:14',
      '1:15',
    ]);
  });

  it('builds row 15 as twelve couches over columns 1-2 up to 23-24', () => {
    const row15 = buildAuditorium([])[14];
    const couches = row15.cells.filter((cell) => cell.kind === 'couch');
    expect(
      couches.map((couch) => (couch.kind === 'couch' ? [couch.columnStart, couch.columnEnd] : [])),
    ).toEqual(Array.from({ length: 12 }, (_, i) => [i * 2 + 1, i * 2 + 2]));
  });

  it('marks occupied seats unavailable and a couch unavailable when either seat is occupied', () => {
    const rows = buildAuditorium(['R3C7', 'R15C6']);
    const seat = seatsOf(rows).find((cell) => cell.row === 3 && cell.column === 7);
    expect(seat?.state).toBe('unavailable');
    const couch = rows[14].cells.find((cell) => cell.kind === 'couch' && cell.columnStart === 5);
    expect(couch).toMatchObject({ state: 'unavailable' });
    const freeCouch = rows[14].cells.find(
      (cell) => cell.kind === 'couch' && cell.columnStart === 7,
    );
    expect(freeCouch).toMatchObject({ state: 'available' });
  });
});
