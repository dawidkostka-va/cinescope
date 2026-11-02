export const MAX_SEATS = 10;
const ROW_COUNT = 15;
const COUCH_ROW = 15;
const ACCESSIBLE_ROW = 1;
const ACCESSIBLE_COLUMNS = [10, 15] as const;
const ENTRANCE_LAST_ROW = 10;

export interface Selection {
  row: number;
  column: number;
  couch: boolean;
}

export interface Cell {
  kind: 'entrance' | 'seat' | 'couch';
  row: number;
  column: number;
  endColumn: number;
  accessible: boolean;
}

export interface RowLayout {
  row: number;
  blocks: Cell[][];
}

const BLOCK_RANGES: [number, number][] = [
  [1, 4],
  [5, 20],
  [21, 24],
];

function blockCells(row: number, index: number, from: number, to: number): Cell[] {
  if (index === 0 && row <= ENTRANCE_LAST_ROW) {
    return [{ kind: 'entrance', row, column: 0, endColumn: 0, accessible: false }];
  }
  const cells: Cell[] = [];
  if (row === COUCH_ROW) {
    for (let column = from; column <= to; column += 2) {
      cells.push({ kind: 'couch', row, column, endColumn: column + 1, accessible: false });
    }
  } else {
    for (let column = from; column <= to; column++) {
      const accessible =
        row === ACCESSIBLE_ROW && column >= ACCESSIBLE_COLUMNS[0] && column <= ACCESSIBLE_COLUMNS[1];
      cells.push({ kind: 'seat', row, column, endColumn: column, accessible });
    }
  }
  return cells;
}

export const AUDITORIUM: RowLayout[] = Array.from({ length: ROW_COUNT }, (_, index) => {
  const row = index + 1;
  return {
    row,
    blocks: BLOCK_RANGES.map(([from, to], blockIndex) => blockCells(row, blockIndex, from, to)),
  };
});

export function toSelection(cell: Cell): Selection {
  return { row: cell.row, column: cell.column, couch: cell.kind === 'couch' };
}

export function isSameSelection(a: Selection, b: Selection): boolean {
  return a.row === b.row && a.column === b.column && a.couch === b.couch;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function seatIds(selection: Selection): string[] {
  return selection.couch
    ? [seatId(selection.row, selection.column), seatId(selection.row, selection.column + 1)]
    : [seatId(selection.row, selection.column)];
}

export function seatLabel(selection: Selection): string {
  return selection.couch ? `${selection.column}-${selection.column + 1}` : `${selection.column}`;
}

export function describeSeat(selection: Selection): string {
  return selection.couch ? `Couch ${seatLabel(selection)}` : seatLabel(selection);
}

export function priceOf(selection: Selection): number {
  if (selection.couch) {
    return 89;
  }
  if (selection.row <= 5) {
    return 25;
  }
  if (selection.row <= ENTRANCE_LAST_ROW) {
    return 32;
  }
  return 39;
}

export function seatCount(selections: Selection[]): number {
  return selections.reduce((total, selection) => total + (selection.couch ? 2 : 1), 0);
}

export function sortSelections(selections: Selection[]): Selection[] {
  return [...selections].sort((a, b) => a.row - b.row || a.column - b.column);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}
