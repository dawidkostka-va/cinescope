import { SEAT_COLORS, SeatState } from '../../utils/colors';
import { AuditoriumItem, AuditoriumRow, seatId } from '../../utils/seats';
import './SeatMap.scss';

function trackForColumn(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

function stateFor(ids: string[], accessible: boolean, selected: Set<string>, occupied: Set<string>): SeatState {
  if (ids.some((id) => occupied.has(id))) return 'unavailable';
  if (ids.every((id) => selected.has(id))) return 'selected';
  return accessible ? 'accessible' : 'available';
}

interface SeatMapProps {
  rows: AuditoriumRow[];
  selected: Set<string>;
  occupied: Set<string>;
  onToggle: (ids: string[]) => void;
}

export function SeatMap({ rows, selected, occupied, onToggle }: SeatMapProps) {
  return (
    <div className="seat-map" data-testid="seat-map">
      {rows.map((row) => (
        <SeatMapRow key={row.row} row={row} selected={selected} occupied={occupied} onToggle={onToggle} />
      ))}
    </div>
  );
}

function SeatMapRow({
  row,
  selected,
  occupied,
  onToggle,
}: {
  row: AuditoriumRow;
  selected: Set<string>;
  occupied: Set<string>;
  onToggle: (ids: string[]) => void;
}) {
  return (
    <div className="seat-row" data-testid="seat-row" data-row={row.row}>
      <span className="row-label" data-testid="row-label-left" data-row={row.row} style={{ gridColumn: 1 }}>
        {row.row}
      </span>
      <span className="aisle" data-testid="aisle" data-row={row.row} style={{ gridColumn: 6 }} />
      <span className="aisle" data-testid="aisle" data-row={row.row} style={{ gridColumn: 23 }} />
      <span className="row-label" data-testid="row-label-right" data-row={row.row} style={{ gridColumn: 28 }}>
        {row.row}
      </span>
      {row.items.map((item) => (
        <SeatMapItem key={itemKey(item)} item={item} selected={selected} occupied={occupied} onToggle={onToggle} />
      ))}
    </div>
  );
}

function itemKey(item: AuditoriumItem): string {
  return item.kind === 'seat' ? `s${item.column}` : `c${item.columnStart}`;
}

function SeatMapItem({
  item,
  selected,
  occupied,
  onToggle,
}: {
  item: AuditoriumItem;
  selected: Set<string>;
  occupied: Set<string>;
  onToggle: (ids: string[]) => void;
}) {
  if (item.kind === 'seat') {
    const id = seatId(item.row, item.column);
    const state = stateFor([id], item.accessible, selected, occupied);
    return (
      <button
        type="button"
        className="seat"
        data-testid="seat"
        data-row={item.row}
        data-column={item.column}
        data-state={state}
        disabled={state === 'unavailable'}
        style={{ gridColumn: trackForColumn(item.column), backgroundColor: SEAT_COLORS[state] }}
        onClick={() => onToggle([id])}
      >
        {item.column}
      </button>
    );
  }

  const idA = seatId(item.row, item.columnStart);
  const idB = seatId(item.row, item.columnEnd);
  const state = stateFor([idA, idB], false, selected, occupied);
  const startTrack = trackForColumn(item.columnStart);
  const endTrack = trackForColumn(item.columnEnd) + 1;
  return (
    <button
      type="button"
      className="couch"
      data-testid="couch"
      data-row={item.row}
      data-column-start={item.columnStart}
      data-column-end={item.columnEnd}
      data-state={state}
      disabled={state === 'unavailable'}
      style={{ gridColumn: `${startTrack} / ${endTrack}`, backgroundColor: SEAT_COLORS[state] }}
      onClick={() => onToggle([idA, idB])}
    >
      {item.columnStart}-{item.columnEnd}
    </button>
  );
}

export default SeatMap;
