export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const SEAT_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

export interface ParsedSeat {
  row: number;
  column: number;
}

export type AuditoriumCell =
  | { kind: 'entrance' }
  | { kind: 'aisle' }
  | { kind: 'seat'; row: number; column: number; state: SeatState }
  | { kind: 'couch'; row: number; columnStart: number; columnEnd: number; state: SeatState };

export interface AuditoriumRow {
  row: number;
  cells: AuditoriumCell[];
}

export const TOTAL_ROWS = 15;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMN_START = 10;
export const ACCESSIBLE_COLUMN_END = 15;
export const MAX_SEATS_PER_BOOKING = 10;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): ParsedSeat {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessible(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && column >= ACCESSIBLE_COLUMN_START && column <= ACCESSIBLE_COLUMN_END;
}

function seatState(id: string, occupied: ReadonlySet<string>, selected: ReadonlySet<string>, accessible: boolean): SeatState {
  if (occupied.has(id)) {
    return 'unavailable';
  }
  if (selected.has(id)) {
    return 'selected';
  }
  return accessible ? 'accessible' : 'available';
}

function couchState(idStart: string, idEnd: string, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): SeatState {
  if (occupied.has(idStart) || occupied.has(idEnd)) {
    return 'unavailable';
  }
  if (selected.has(idStart) || selected.has(idEnd)) {
    return 'selected';
  }
  return 'available';
}

function buildRow(row: number, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): AuditoriumCell[] {
  const cells: AuditoriumCell[] = [];

  if (row <= 10) {
    cells.push({ kind: 'entrance' });
  } else if (row <= 14) {
    for (let column = 1; column <= 4; column++) {
      cells.push({ kind: 'seat', row, column, state: seatState(seatId(row, column), occupied, selected, false) });
    }
  } else {
    for (let column = 1; column <= 3; column += 2) {
      const idStart = seatId(row, column);
      const idEnd = seatId(row, column + 1);
      cells.push({
        kind: 'couch',
        row,
        columnStart: column,
        columnEnd: column + 1,
        state: couchState(idStart, idEnd, occupied, selected),
      });
    }
  }

  cells.push({ kind: 'aisle' });

  if (row === COUCH_ROW) {
    for (let column = 5; column <= 19; column += 2) {
      const idStart = seatId(row, column);
      const idEnd = seatId(row, column + 1);
      cells.push({
        kind: 'couch',
        row,
        columnStart: column,
        columnEnd: column + 1,
        state: couchState(idStart, idEnd, occupied, selected),
      });
    }
  } else {
    for (let column = 5; column <= 20; column++) {
      const accessible = isAccessible(row, column);
      cells.push({ kind: 'seat', row, column, state: seatState(seatId(row, column), occupied, selected, accessible) });
    }
  }

  cells.push({ kind: 'aisle' });

  if (row === COUCH_ROW) {
    for (let column = 21; column <= 23; column += 2) {
      const idStart = seatId(row, column);
      const idEnd = seatId(row, column + 1);
      cells.push({
        kind: 'couch',
        row,
        columnStart: column,
        columnEnd: column + 1,
        state: couchState(idStart, idEnd, occupied, selected),
      });
    }
  } else {
    for (let column = 21; column <= 24; column++) {
      cells.push({ kind: 'seat', row, column, state: seatState(seatId(row, column), occupied, selected, false) });
    }
  }

  return cells;
}

export function buildAuditorium(occupied: ReadonlySet<string>, selected: ReadonlySet<string>): AuditoriumRow[] {
  const rows: AuditoriumRow[] = [];
  for (let row = 1; row <= TOTAL_ROWS; row++) {
    rows.push({ row, cells: buildRow(row, occupied, selected) });
  }
  return rows;
}

export function seatPrice(row: number): number {
  if (row <= 5) {
    return 25;
  }
  if (row <= 10) {
    return 32;
  }
  if (row <= 14) {
    return 39;
  }
  return 0;
}

export const COUCH_PRICE = 89;

export type SelectionUnit =
  | { type: 'seat'; row: number; column: number; price: number }
  | { type: 'couch'; row: number; columnStart: number; columnEnd: number; price: number };

/** Row 15 couches occupy fixed adjacent column pairs; derive grouping from that layout. */
export function getSelectionUnits(seatIds: string[]): SelectionUnit[] {
  const byRow = new Map<number, Set<number>>();
  for (const id of seatIds) {
    const { row, column } = parseSeatId(id);
    if (!byRow.has(row)) {
      byRow.set(row, new Set());
    }
    byRow.get(row)?.add(column);
  }

  const units: SelectionUnit[] = [];
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  for (const row of rows) {
    const columns = [...(byRow.get(row) ?? [])].sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      for (const column of columns) {
        if (column % 2 === 1) {
          units.push({ type: 'couch', row, columnStart: column, columnEnd: column + 1, price: COUCH_PRICE });
        }
      }
    } else {
      for (const column of columns) {
        units.push({ type: 'seat', row, column, price: seatPrice(row) });
      }
    }
  }
  return units;
}

export function unitSeatIds(unit: SelectionUnit): string[] {
  return unit.type === 'couch' ? [seatId(unit.row, unit.columnStart), seatId(unit.row, unit.columnEnd)] : [seatId(unit.row, unit.column)];
}

/** Seat identifiers ordered the same way the summary lists them: by row, then column. */
export function seatIdsInSummaryOrder(seatIds: string[]): string[] {
  return getSelectionUnits(seatIds).flatMap(unitSeatIds);
}

export function totalPrice(seatIds: string[]): number {
  return getSelectionUnits(seatIds).reduce((sum, unit) => sum + unit.price, 0);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export interface SelectedSeatsRowSummary {
  row: number;
  text: string;
}

export function groupSelectedByRow(seatIds: string[]): SelectedSeatsRowSummary[] {
  const units = getSelectionUnits(seatIds);
  const byRow = new Map<number, string[]>();
  for (const unit of units) {
    const text = unit.type === 'couch' ? `${unit.columnStart}-${unit.columnEnd}` : String(unit.column);
    if (!byRow.has(unit.row)) {
      byRow.set(unit.row, []);
    }
    byRow.get(unit.row)?.push(text);
  }
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  return rows.map((row) => ({ row, text: (byRow.get(row) ?? []).join(', ') }));
}
