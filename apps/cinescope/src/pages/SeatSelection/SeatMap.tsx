import {
  LEFT_BLOCK_COLUMNS,
  MIDDLE_BLOCK_COLUMNS,
  RIGHT_BLOCK_COLUMNS,
  ROW_COUNT,
  SEAT_COLORS,
  SeatState,
  hasLeftBlock,
  isAccessible,
  isCouchRow,
  seatId,
  toCouchPairs,
} from '../../seats/geometry';

interface SeatMapProps {
  occupiedSeats: Set<string>;
  selectedSeats: Set<string>;
  onToggle: (ids: string[], isOccupied: boolean) => void;
}

function seatState(id: string, row: number, column: number, occupied: Set<string>, selected: Set<string>): SeatState {
  if (occupied.has(id)) return 'unavailable';
  if (selected.has(id)) return 'selected';
  if (isAccessible(row, column)) return 'accessible';
  return 'available';
}

function couchState(ids: [string, string], occupied: Set<string>, selected: Set<string>): SeatState {
  if (ids.some((id) => occupied.has(id))) return 'unavailable';
  if (ids.every((id) => selected.has(id))) return 'selected';
  return 'available';
}

export function SeatMap({ occupiedSeats, selectedSeats, onToggle }: SeatMapProps) {
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => i + 1);

  function renderColumns(row: number, columns: number[]) {
    if (isCouchRow(row)) {
      return toCouchPairs(columns).map(([a, b]) => {
        const ids: [string, string] = [seatId(row, a), seatId(row, b)];
        const state = couchState(ids, occupiedSeats, selectedSeats);
        return (
          <button
            key={`${a}-${b}`}
            type="button"
            className="couch"
            data-testid="couch"
            data-row={row}
            data-column-start={a}
            data-column-end={b}
            data-state={state}
            style={{ backgroundColor: SEAT_COLORS[state] }}
            disabled={state === 'unavailable'}
            onClick={() => onToggle(ids, state === 'unavailable')}
          >
            {a}-{b}
          </button>
        );
      });
    }
    return columns.map((column) => {
      const id = seatId(row, column);
      const state = seatState(id, row, column, occupiedSeats, selectedSeats);
      return (
        <button
          key={column}
          type="button"
          className="seat"
          data-testid="seat"
          data-row={row}
          data-column={column}
          data-state={state}
          style={{ backgroundColor: SEAT_COLORS[state] }}
          disabled={state === 'unavailable'}
          onClick={() => onToggle([id], state === 'unavailable')}
        >
          {column}
        </button>
      );
    });
  }

  return (
    <div className="seat-map" data-testid="seat-map">
      {rows.map((row) => (
        <div key={row} className="seat-row" data-testid="seat-row" data-row={row}>
          <div className="row-label" data-testid="row-label-left" data-row={row}>
            {row}
          </div>
          <div className="block block--side">{hasLeftBlock(row) ? renderColumns(row, LEFT_BLOCK_COLUMNS) : null}</div>
          <div className="aisle" data-testid="aisle" data-row={row} />
          <div className="block block--middle">{renderColumns(row, MIDDLE_BLOCK_COLUMNS)}</div>
          <div className="aisle" data-testid="aisle" data-row={row} />
          <div className="block block--side">{renderColumns(row, RIGHT_BLOCK_COLUMNS)}</div>
          <div className="row-label" data-testid="row-label-right" data-row={row}>
            {row}
          </div>
        </div>
      ))}
    </div>
  );
}
