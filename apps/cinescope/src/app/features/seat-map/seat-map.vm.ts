import { RowCell, TOTAL_ROWS, buildRow } from '../../core/seat.util';

export interface SeatMapRow {
  row: number;
  cells: RowCell[];
}

export function buildSeatMapRows(): SeatMapRow[] {
  return Array.from({ length: TOTAL_ROWS }, (_, i) => {
    const row = i + 1;
    return { row, cells: buildRow(row) };
  });
}
