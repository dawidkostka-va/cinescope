import type { ReactNode } from 'react';
import {
  AISLE_AFTER_COLUMN_LEFT,
  AISLE_AFTER_COLUMN_RIGHT,
  COLUMN_COUNT,
  ROW_COUNT,
  couchPairStarts,
  couchSeatIds,
  isAccessible,
  isCouchRow,
  rowHasBlockOne,
  seatId,
  type SeatState,
} from '../../domain/seatMap';

const STATE_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

function trackForColumn(column: number): number {
  if (column <= AISLE_AFTER_COLUMN_LEFT) return column + 1;
  if (column <= AISLE_AFTER_COLUMN_RIGHT) return column + 2;
  return column + 3;
}

interface AuditoriumGridProps {
  occupied: Set<string>;
  selected: Set<string>;
  onToggleSeat: (id: string) => void;
  onToggleCouch: (ids: [string, string]) => void;
}

function seatState(row: number, column: number, occupied: Set<string>, selected: Set<string>): SeatState {
  const id = seatId(row, column);
  if (occupied.has(id)) return 'unavailable';
  if (selected.has(id)) return 'selected';
  if (isAccessible(row, column)) return 'accessible';
  return 'available';
}

function couchState(a: string, b: string, occupied: Set<string>, selected: Set<string>): SeatState {
  if (occupied.has(a) || occupied.has(b)) return 'unavailable';
  if (selected.has(a) && selected.has(b)) return 'selected';
  return 'available';
}

function regularColumnsFor(row: number): number[] {
  const columns: number[] = [];
  const start = rowHasBlockOne(row) ? 1 : 5;
  for (let column = start; column <= COLUMN_COUNT; column += 1) {
    columns.push(column);
  }
  return columns;
}

function Row({ row, occupied, selected, onToggleSeat, onToggleCouch }: AuditoriumGridProps & { row: number }) {
  const children: ReactNode[] = [];

  children.push(
    <div
      key="label-left"
      data-testid="row-label-left"
      data-row={row}
      className="row-label"
      style={{ gridColumn: 1 }}
    >
      {row}
    </div>,
  );

  if (isCouchRow(row)) {
    for (const pairStart of couchPairStarts()) {
      const [a, b] = couchSeatIds(row, pairStart);
      const state = couchState(a, b, occupied, selected);
      children.push(
        <button
          key={a}
          type="button"
          data-testid="couch"
          data-row={row}
          data-column-start={pairStart}
          data-column-end={pairStart + 1}
          data-state={state}
          className="couch"
          style={{
            gridColumn: `${trackForColumn(pairStart)} / span 2`,
            backgroundColor: STATE_COLORS[state],
          }}
          disabled={state === 'unavailable'}
          onClick={() => onToggleCouch([a, b])}
        >
          {pairStart}-{pairStart + 1}
        </button>,
      );
    }
  } else {
    for (const column of regularColumnsFor(row)) {
      const state = seatState(row, column, occupied, selected);
      const id = seatId(row, column);
      children.push(
        <button
          key={id}
          type="button"
          data-testid="seat"
          data-row={row}
          data-column={column}
          data-state={state}
          className="seat"
          style={{ gridColumn: trackForColumn(column), backgroundColor: STATE_COLORS[state] }}
          disabled={state === 'unavailable'}
          onClick={() => onToggleSeat(id)}
        >
          {column}
        </button>,
      );
    }
  }

  children.push(
    <div key="aisle-left" data-testid="aisle" data-row={row} className="aisle" style={{ gridColumn: 6 }} />,
  );
  children.push(
    <div key="aisle-right" data-testid="aisle" data-row={row} className="aisle" style={{ gridColumn: 23 }} />,
  );

  children.push(
    <div
      key="label-right"
      data-testid="row-label-right"
      data-row={row}
      className="row-label"
      style={{ gridColumn: 28 }}
    >
      {row}
    </div>,
  );

  return (
    <div data-testid="seat-row" data-row={row} className="seat-row">
      {children}
    </div>
  );
}

export function AuditoriumGrid(props: AuditoriumGridProps) {
  const rows = [];
  for (let row = 1; row <= ROW_COUNT; row += 1) {
    rows.push(<Row key={row} row={row} {...props} />);
  }
  return (
    <div data-testid="seat-map" className="seat-map">
      {rows}
    </div>
  );
}
