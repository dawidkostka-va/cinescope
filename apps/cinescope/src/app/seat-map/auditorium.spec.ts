import { AUDITORIUM, Cell, cellIds, cellKey } from './auditorium';
import { priceOf } from '../pricing';

function allCells(): Cell[] {
  return AUDITORIUM.flatMap((row) =>
    row.segments.flatMap((segment) => (segment.type === 'block' ? segment.cells : [])),
  );
}

describe('auditorium', () => {
  it('has 15 rows and 308 selectable elements', () => {
    expect(AUDITORIUM.length).toBe(15);
    expect(allCells().length).toBe(308);
  });

  it('has 12 couches in row 15 covering columns 1-24', () => {
    const couches = allCells().filter((c) => c.kind === 'couch');
    expect(couches.length).toBe(12);
    expect(couches.every((c) => c.row === 15 && c.end === c.start + 1)).toBe(true);
    expect(couches.map((c) => c.start)).toEqual([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23]);
  });

  it('marks six accessible seats in row 1', () => {
    const accessible = allCells().filter((c) => c.kind === 'seat' && c.accessible);
    expect(accessible.map((c) => c.kind === 'seat' && c.column)).toEqual([10, 11, 12, 13, 14, 15]);
  });

  it('has an entrance instead of columns 1-4 in rows 1-10 and no seat there', () => {
    const row5 = AUDITORIUM[4];
    expect(row5.segments[0].type).toBe('entrance');
    const row11 = AUDITORIUM[10];
    expect(row11.segments[0].type).toBe('block');
  });

  it('uses unique ids for every seat identifier', () => {
    const ids = allCells().flatMap(cellIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(allCells().map(cellKey)).size).toBe(308);
  });

  it('prices seats by row and couches per couch', () => {
    const cell = (row: number): Cell => ({ kind: 'seat', row, column: 12, accessible: false });
    expect(priceOf(cell(1))).toBe(25);
    expect(priceOf(cell(5))).toBe(25);
    expect(priceOf(cell(6))).toBe(32);
    expect(priceOf(cell(10))).toBe(32);
    expect(priceOf(cell(11))).toBe(39);
    expect(priceOf(cell(14))).toBe(39);
    expect(priceOf({ kind: 'couch', row: 15, start: 1, end: 2 })).toBe(89);
  });
});
