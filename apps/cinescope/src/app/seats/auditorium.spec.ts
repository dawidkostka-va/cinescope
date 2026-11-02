import { unitsOf } from '../booking/units';
import { buildAuditorium, CouchItem, RowItem, SeatItem } from './auditorium';

const none = new Set<string>();

function itemsOf(rows: ReturnType<typeof buildAuditorium>): RowItem[] {
  return rows.flatMap((row) => row.items);
}

describe('auditorium layout', () => {
  it('has 296 seats and 12 couches', () => {
    const items = itemsOf(buildAuditorium(none, none));
    const seats = items.filter((item): item is SeatItem => item.kind === 'seat');
    const couches = items.filter((item): item is CouchItem => item.kind === 'couch');
    expect(seats.length).toBe(296);
    expect(couches.length).toBe(12);
  });

  it('renders six accessible seats in row 1', () => {
    const accessible = itemsOf(buildAuditorium(none, none)).filter(
      (item): item is SeatItem => item.kind === 'seat' && item.state === 'accessible',
    );
    expect(accessible.map((seat) => seat.column)).toEqual([10, 11, 12, 13, 14, 15]);
    expect(accessible.every((seat) => seat.row === 1)).toBe(true);
  });

  it('marks a couch unavailable when either of its seats is occupied', () => {
    const rows = buildAuditorium(new Set(['R15C6']), none);
    const couch = rows[14].items.find(
      (item): item is CouchItem => item.kind === 'couch' && item.start === 5,
    );
    expect(couch?.state).toBe('unavailable');
  });

  it('keeps both aisles in every row', () => {
    for (const row of buildAuditorium(none, none)) {
      expect(row.items.filter((item) => item.kind === 'aisle').length).toBe(2);
    }
  });
});

describe('seat units', () => {
  it('groups row 15 seats into couches and prices them', () => {
    const units = unitsOf(['R7C12', 'R7C11', 'R15C2', 'R15C1']);
    expect(units.map((unit) => unit.label)).toEqual(['11', '12', '1-2']);
    expect(units.map((unit) => unit.price)).toEqual([32, 32, 89]);
    expect(units[2].ids).toEqual(['R15C1', 'R15C2']);
  });
});
