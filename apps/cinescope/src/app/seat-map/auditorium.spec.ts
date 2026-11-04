import { buildAuditorium, RowItem, seatId } from './auditorium';

const rows = buildAuditorium(new Set());
const itemsOf = (row: number): RowItem[] => rows[row - 1].items;
const selectable = (items: RowItem[]) => items.filter((item) => item.kind === 'seat' || item.kind === 'couch');

describe('buildAuditorium', () => {
  it('has 15 rows', () => {
    expect(rows.map((row) => row.row)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('has 308 selectable elements', () => {
    const total = rows.reduce((sum, row) => sum + selectable(row.items).length, 0);
    expect(total).toBe(308);
  });

  it('starts rows 1-10 at column 5 and rows 11-15 at column 1', () => {
    expect(selectable(itemsOf(1))[0]).toMatchObject({ kind: 'seat', column: 5 });
    expect(selectable(itemsOf(11))[0]).toMatchObject({ kind: 'seat', column: 1 });
    expect(itemsOf(1)[0]).toEqual({ kind: 'entrance' });
  });

  it('has both aisles in every row', () => {
    for (const row of rows) {
      expect(row.items.filter((item) => item.kind === 'aisle')).toHaveLength(2);
    }
  });

  it('marks row 1 columns 10-15 as accessible', () => {
    const accessible = selectable(itemsOf(1)).filter((item) => item.kind === 'seat' && item.state === 'accessible');
    expect(accessible.map((item) => (item.kind === 'seat' ? item.column : 0))).toEqual([10, 11, 12, 13, 14, 15]);
  });

  it('renders 12 couches in row 15 covering columns 1-24', () => {
    const couches = itemsOf(15).filter((item) => item.kind === 'couch');
    expect(couches.map((item) => (item.kind === 'couch' ? `${item.startColumn}-${item.endColumn}` : ''))).toEqual([
      '1-2', '3-4', '5-6', '7-8', '9-10', '11-12', '13-14', '15-16', '17-18', '19-20', '21-22', '23-24',
    ]);
  });

  it('marks a couch unavailable when either of its seats is occupied', () => {
    const occupied = new Set([seatId(15, 6)]);
    const couch = buildAuditorium(occupied)[14].items.find(
      (item) => item.kind === 'couch' && item.startColumn === 5,
    );
    expect(couch).toMatchObject({ state: 'unavailable' });
  });
});
