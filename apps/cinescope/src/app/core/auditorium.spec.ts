import { buildAuditorium, CouchItem, LayoutItem, SeatItem } from './auditorium';

const none = new Set<string>();

function seatsOf(items: LayoutItem[]): SeatItem[] {
  return items.filter((item): item is SeatItem => item.kind === 'seat');
}

function couchesOf(items: LayoutItem[]): CouchItem[] {
  return items.filter((item): item is CouchItem => item.kind === 'couch');
}

function kindsOf(items: LayoutItem[]): string[] {
  return items.map((item) => item.kind);
}

describe('buildAuditorium', () => {
  const rows = buildAuditorium(none, none);

  it('has 15 rows numbered 1 to 15', () => {
    expect(rows.map((row) => row.number)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('has 308 selectable elements: 200 seats in rows 1-10, 96 in rows 11-14 and 12 couches in row 15', () => {
    const selectable = (row: number) => rows[row - 1].items.filter((i) => i.kind === 'seat' || i.kind === 'couch');
    const count = (from: number, to: number) =>
      Array.from({ length: to - from + 1 }, (_, i) => selectable(from + i).length).reduce((a, b) => a + b, 0);
    expect(count(1, 10)).toBe(200);
    expect(count(11, 14)).toBe(96);
    expect(count(15, 15)).toBe(12);
  });

  it('numbers columns globally, starting at 5 in rows 1-10 and at 1 in rows 11-14', () => {
    const columnsOf = (row: number) => seatsOf(rows[row - 1].items).map((seat) => seat.column);
    expect(columnsOf(1)[0]).toBe(5);
    expect(columnsOf(1).at(-1)).toBe(24);
    expect(columnsOf(11)[0]).toBe(1);
    expect(columnsOf(11).at(-1)).toBe(24);
  });

  it('places both aisles in every row, between columns 4 and 5 and between columns 20 and 21', () => {
    const row11 = kindsOf(rows[10].items);
    expect(row11.indexOf('aisle')).toBe(4);
    expect(row11.lastIndexOf('aisle')).toBe(21);
    const row1 = kindsOf(rows[0].items);
    expect(row1.indexOf('aisle')).toBe(1);
    expect(row1.lastIndexOf('aisle')).toBe(18);
    for (const row of rows) {
      expect(row.items.filter((item) => item.kind === 'aisle')).toHaveLength(2);
    }
  });

  it('leaves an empty entrance before column 5 in rows 1-10 only', () => {
    expect(rows[0].items[0].kind).toBe('entrance');
    expect(rows[9].items[0].kind).toBe('entrance');
    expect(rows[10].items[0].kind).toBe('seat');
  });

  it('marks six accessible seats in row 1, columns 10 to 15', () => {
    const accessible = seatsOf(rows[0].items).filter((seat) => seat.state === 'accessible');
    expect(accessible.map((seat) => seat.column)).toEqual([10, 11, 12, 13, 14, 15]);
  });

  it('renders 12 couches in row 15 covering columns 1-2 through 23-24', () => {
    const couches = couchesOf(rows[14].items);
    expect(couches.map((couch) => [couch.start, couch.end])).toEqual(
      Array.from({ length: 12 }, (_, i) => [i * 2 + 1, i * 2 + 2]),
    );
    expect(seatsOf(rows[14].items)).toHaveLength(0);
  });

  it('marks a couch unavailable when either of its seats is occupied', () => {
    const occupied = buildAuditorium(new Set(['R15C6']), none);
    expect(couchesOf(occupied[14].items).find((couch) => couch.start === 5)?.state).toBe('unavailable');
    expect(couchesOf(occupied[14].items).find((couch) => couch.start === 1)?.state).toBe('available');
  });

  it('reports selected accessible seats as selected and occupied accessible seats as unavailable', () => {
    const stateOf = (occupied: string[], selected: string[], column: number) =>
      seatsOf(buildAuditorium(new Set(occupied), new Set(selected))[0].items).find((s) => s.column === column)?.state;
    expect(stateOf([], ['R1C10'], 10)).toBe('selected');
    expect(stateOf(['R1C11'], [], 11)).toBe('unavailable');
    expect(stateOf([], [], 12)).toBe('accessible');
    expect(stateOf([], [], 16)).toBe('available');
  });
});
