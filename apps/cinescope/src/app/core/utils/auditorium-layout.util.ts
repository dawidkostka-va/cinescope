import { couchPairs, isAccessible, seatId, TOTAL_ROWS } from './seat.util';

export interface SeatCellVm {
  kind: 'seat';
  row: number;
  column: number;
  id: string;
  accessible: boolean;
  gridColumn: number;
}

export interface CouchCellVm {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  id1: string;
  id2: string;
  gridColumnStart: number;
  gridColumnEnd: number;
}

export type CellVm = SeatCellVm | CouchCellVm;

export interface RowVm {
  row: number;
  blockA: CellVm[];
  blockB: CellVm[];
  blockC: CellVm[];
}

/**
 * Maps a seat column (1-24) to its CSS grid track. Track layout:
 * 1 = left row label, 2-5 = columns 1-4, 6 = aisle, 7-22 = columns 5-20,
 * 23 = aisle, 24-27 = columns 21-24, 28 = right row label.
 */
export function gridTrack(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column - 5 + 7;
  return column - 21 + 24;
}

function makeSeatCell(row: number, column: number): SeatCellVm {
  return {
    kind: 'seat',
    row,
    column,
    id: seatId(row, column),
    accessible: isAccessible(row, column),
    gridColumn: gridTrack(column),
  };
}

function makeCouchCell(row: number, start: number, end: number): CouchCellVm {
  return {
    kind: 'couch',
    row,
    columnStart: start,
    columnEnd: end,
    id1: seatId(row, start),
    id2: seatId(row, end),
    gridColumnStart: gridTrack(start),
    gridColumnEnd: gridTrack(end) + 1,
  };
}

function buildAuditoriumLayout(): RowVm[] {
  const rows: RowVm[] = [];

  for (let row = 1; row <= 14; row++) {
    const blockA: CellVm[] = [];
    if (row >= 11) {
      for (let column = 1; column <= 4; column++) {
        blockA.push(makeSeatCell(row, column));
      }
    }

    const blockB: CellVm[] = [];
    for (let column = 5; column <= 20; column++) {
      blockB.push(makeSeatCell(row, column));
    }

    const blockC: CellVm[] = [];
    for (let column = 21; column <= 24; column++) {
      blockC.push(makeSeatCell(row, column));
    }

    rows.push({ row, blockA, blockB, blockC });
  }

  const pairs = couchPairs();
  rows.push({
    row: TOTAL_ROWS,
    blockA: pairs.filter(([start]) => start <= 4).map(([start, end]) => makeCouchCell(TOTAL_ROWS, start, end)),
    blockB: pairs.filter(([start]) => start >= 5 && start <= 19).map(([start, end]) => makeCouchCell(TOTAL_ROWS, start, end)),
    blockC: pairs.filter(([start]) => start >= 21).map(([start, end]) => makeCouchCell(TOTAL_ROWS, start, end)),
  });

  return rows;
}

export const AUDITORIUM_LAYOUT: readonly RowVm[] = buildAuditoriumLayout();
