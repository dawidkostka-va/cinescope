import { auditoriumRows, cellsForIds, seatCount, sortByPosition } from './auditorium';
import { formatPrice, priceOf } from './pricing';

const allCells = auditoriumRows.flatMap((row) => row.cells);

describe('auditorium', () => {
  it('has 308 selectable elements: 296 seats and 12 couches', () => {
    expect(allCells.length).toBe(308);
    expect(allCells.filter((cell) => cell.kind === 'seat').length).toBe(296);
    expect(allCells.filter((cell) => cell.kind === 'couch').length).toBe(12);
  });

  it('starts rows 1 to 10 at column 5 and rows 11 to 14 at column 1', () => {
    expect(auditoriumRows[0].cells[0]).toMatchObject({ kind: 'seat', column: 5 });
    expect(auditoriumRows[9].cells[0]).toMatchObject({ kind: 'seat', column: 5 });
    expect(auditoriumRows[10].cells[0]).toMatchObject({ kind: 'seat', column: 1 });
  });

  it('marks only row 1, columns 10 to 15 as accessible', () => {
    const accessible = allCells.filter((cell) => cell.kind === 'seat' && cell.accessible);
    expect(accessible.map((cell) => cell.id)).toEqual(['R1C10', 'R1C11', 'R1C12', 'R1C13', 'R1C14', 'R1C15']);
  });

  it('builds couches over row 15 as pairs of columns', () => {
    const couches = auditoriumRows[14].cells;
    expect(couches.length).toBe(12);
    expect(couches[0]).toMatchObject({ kind: 'couch', ids: ['R15C1', 'R15C2'] });
    expect(couches[11]).toMatchObject({ kind: 'couch', ids: ['R15C23', 'R15C24'] });
    expect(couches.every((cell) => seatCount(cell) === 2)).toBe(true);
  });

  it('resolves ids to cells and sorts them by position', () => {
    const cells = sortByPosition(cellsForIds(['R15C3', 'R2C9', 'R15C1', 'R2C5']));
    expect(cells.map((cell) => cell.id)).toEqual(['R2C5', 'R2C9', 'R15C1', 'R15C3']);
  });
});

describe('pricing', () => {
  const seat = (row: number) => allCells.find((cell) => cell.kind === 'seat' && cell.row === row)!;

  it('prices seats by row band', () => {
    expect(priceOf(seat(1))).toBe(25);
    expect(priceOf(seat(5))).toBe(25);
    expect(priceOf(seat(6))).toBe(32);
    expect(priceOf(seat(10))).toBe(32);
    expect(priceOf(seat(11))).toBe(39);
    expect(priceOf(seat(14))).toBe(39);
  });

  it('prices couches at 89', () => {
    const couch = allCells.find((cell) => cell.kind === 'couch')!;
    expect(priceOf(couch)).toBe(89);
  });

  it('formats prices with two decimals and the currency', () => {
    expect(formatPrice(121)).toBe('121.00 PLN');
  });
});
