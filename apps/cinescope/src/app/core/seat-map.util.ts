export type SeatCell =
  | { kind: 'entrance' }
  | { kind: 'aisle' }
  | { kind: 'seat'; column: number; accessible: boolean }
  | { kind: 'couch'; columnStart: number; columnEnd: number };

export const TOTAL_ROWS = 15;

export function buildRowCells(row: number): SeatCell[] {
  const cells: SeatCell[] = [];

  if (row <= 10) {
    cells.push({ kind: 'entrance' });
  } else if (row === 15) {
    cells.push({ kind: 'couch', columnStart: 1, columnEnd: 2 }, { kind: 'couch', columnStart: 3, columnEnd: 4 });
  } else {
    for (let column = 1; column <= 4; column++) {
      cells.push({ kind: 'seat', column, accessible: false });
    }
  }

  cells.push({ kind: 'aisle' });

  if (row === 15) {
    for (let column = 5; column <= 19; column += 2) {
      cells.push({ kind: 'couch', columnStart: column, columnEnd: column + 1 });
    }
  } else {
    for (let column = 5; column <= 20; column++) {
      cells.push({ kind: 'seat', column, accessible: row === 1 && column >= 10 && column <= 15 });
    }
  }

  cells.push({ kind: 'aisle' });

  if (row === 15) {
    cells.push({ kind: 'couch', columnStart: 21, columnEnd: 22 }, { kind: 'couch', columnStart: 23, columnEnd: 24 });
  } else {
    for (let column = 21; column <= 24; column++) {
      cells.push({ kind: 'seat', column, accessible: false });
    }
  }

  return cells;
}
