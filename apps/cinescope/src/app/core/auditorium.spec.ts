import { AUDITORIUM, Cell } from './auditorium';

const cells: Cell[] = AUDITORIUM.flatMap((row) => [...(row.left ?? []), ...row.middle, ...row.right]);

describe('auditorium layout', () => {
  it('has 308 selectable elements', () => {
    expect(cells.length).toBe(308);
  });

  it('has 296 seats and 12 couches', () => {
    expect(cells.filter((cell) => cell.kind === 'seat').length).toBe(296);
    expect(cells.filter((cell) => cell.kind === 'couch').length).toBe(12);
  });

  it('has six accessible seats in row 1', () => {
    const accessible = cells.filter((cell) => cell.kind === 'seat' && cell.accessible);
    expect(accessible.length).toBe(6);
    expect(accessible.every((cell) => cell.kind === 'seat' && cell.row === 1)).toBe(true);
  });

  it('has no left block in rows 1 to 10', () => {
    expect(AUDITORIUM.slice(0, 10).every((row) => row.left === null)).toBe(true);
    expect(AUDITORIUM.slice(10).every((row) => row.left !== null)).toBe(true);
  });
});
