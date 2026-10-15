import {
  couchPairs,
  formatPrice,
  isAccessible,
  priceForRow,
  seatColumnTrack,
  seatId,
  seatLabel,
  seatState,
  selectedSeatsByRow,
  toSummaryItems,
} from './seats';

describe('priceForRow', () => {
  it('prices rows 1-5 at 25', () => {
    expect(priceForRow(1)).toBe(25);
    expect(priceForRow(5)).toBe(25);
  });
  it('prices rows 6-10 at 32', () => {
    expect(priceForRow(6)).toBe(32);
    expect(priceForRow(10)).toBe(32);
  });
  it('prices rows 11-14 at 39', () => {
    expect(priceForRow(11)).toBe(39);
    expect(priceForRow(14)).toBe(39);
  });
  it('prices row 15 (couch) at 89', () => {
    expect(priceForRow(15)).toBe(89);
  });
});

describe('formatPrice', () => {
  it('formats with two decimals and PLN suffix', () => {
    expect(formatPrice(25)).toBe('25.00 PLN');
    expect(formatPrice(121)).toBe('121.00 PLN');
  });
});

describe('isAccessible', () => {
  it('is true only for row 1, columns 10-15', () => {
    expect(isAccessible(1, 10)).toBe(true);
    expect(isAccessible(1, 15)).toBe(true);
    expect(isAccessible(1, 9)).toBe(false);
    expect(isAccessible(1, 16)).toBe(false);
    expect(isAccessible(2, 12)).toBe(false);
  });
});

describe('couchPairs', () => {
  it('produces 12 adjacent pairs covering columns 1-24', () => {
    const pairs = couchPairs();
    expect(pairs).toHaveLength(12);
    expect(pairs[0]).toEqual([1, 2]);
    expect(pairs[11]).toEqual([23, 24]);
  });
});

describe('seatColumnTrack', () => {
  it('keeps global column alignment across the aisles', () => {
    expect(seatColumnTrack(1)).toBe(2);
    expect(seatColumnTrack(4)).toBe(5);
    expect(seatColumnTrack(5)).toBe(7);
    expect(seatColumnTrack(20)).toBe(22);
    expect(seatColumnTrack(21)).toBe(24);
    expect(seatColumnTrack(24)).toBe(27);
  });
});

describe('seatState', () => {
  it('reports unavailable when occupied', () => {
    const occupied = new Set([seatId(7, 12)]);
    expect(seatState(7, 12, occupied, new Set())).toBe('unavailable');
  });
  it('reports selected when selected and not occupied', () => {
    const selected = new Set([seatId(7, 12)]);
    expect(seatState(7, 12, new Set(), selected)).toBe('selected');
  });
  it('reports accessible for free row-1 seats in columns 10-15', () => {
    expect(seatState(1, 12, new Set(), new Set())).toBe('accessible');
  });
  it('reports available for an ordinary free seat', () => {
    expect(seatState(7, 12, new Set(), new Set())).toBe('available');
  });
  it('treats a couch as unavailable when either half is occupied', () => {
    const occupied = new Set([seatId(15, 6)]);
    expect(seatState(15, 5, occupied, new Set())).toBe('unavailable');
    expect(seatState(15, 6, occupied, new Set())).toBe('unavailable');
  });
  it('treats a couch as selected when its identifiers are selected', () => {
    const selected = new Set([seatId(15, 5), seatId(15, 6)]);
    expect(seatState(15, 5, new Set(), selected)).toBe('selected');
    expect(seatState(15, 6, new Set(), selected)).toBe('selected');
  });
  it('never reports a couch as accessible', () => {
    expect(seatState(15, 11, new Set(), new Set())).toBe('available');
  });
});

describe('toSummaryItems', () => {
  it('orders items by row then column', () => {
    const items = toSummaryItems([seatId(7, 12), seatId(3, 5), seatId(7, 11)]);
    expect(items.map((item) => [item.row, item.columnStart])).toEqual([
      [3, 5],
      [7, 11],
      [7, 12],
    ]);
  });
  it('groups a couch identifier pair into one item', () => {
    const items = toSummaryItems([seatId(15, 5), seatId(15, 6)]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ row: 15, columnStart: 5, columnEnd: 6, price: 89 });
  });
  it('labels a couch as Couch a-b and a seat as its column', () => {
    const items = toSummaryItems([seatId(7, 12), seatId(15, 3), seatId(15, 4)]);
    expect(seatLabel(items[0])).toBe('12');
    expect(seatLabel(items[1])).toBe('Couch 3-4');
  });
});

describe('selectedSeatsByRow', () => {
  it('returns no rows and a zero count for an empty selection', () => {
    expect(selectedSeatsByRow([])).toEqual([]);
  });
  it('formats one line per row in ascending column order', () => {
    const rows = selectedSeatsByRow([seatId(7, 12), seatId(7, 11), seatId(15, 1), seatId(15, 2)]);
    expect(rows).toEqual([
      { row: 7, label: '11, 12' },
      { row: 15, label: '1-2' },
    ]);
  });
});
