import {
  AISLE_TRACK_1,
  AISLE_TRACK_2,
  LEFT_LABEL_TRACK,
  RIGHT_LABEL_TRACK,
  RowCell,
  SEAT_COLORS,
  buildRowCells,
  seatColumnTrack,
  seatId,
  seatState,
} from '../../lib/seats';
import styles from './SeatMap.module.scss';

interface SeatRowProps {
  row: number;
  occupied: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  onToggle: (identifiers: string[]) => void;
}

function cellBlock(cell: RowCell): number {
  const start = cell.kind === 'seat' ? cell.column : cell.columnStart;
  if (start <= 4) return 0;
  if (start <= 20) return 1;
  return 2;
}

export function SeatRow({ row, occupied, selected, onToggle }: SeatRowProps) {
  const cells = buildRowCells(row);

  function renderCell(cell: RowCell) {
    if (cell.kind === 'seat') {
      const state = seatState(row, cell.column, occupied, selected);
      const id = seatId(row, cell.column);
      return (
        <div
          key={id}
          data-testid="seat"
          data-row={row}
          data-column={cell.column}
          data-state={state}
          className={styles.seat}
          style={{ gridColumn: seatColumnTrack(cell.column), backgroundColor: SEAT_COLORS[state] }}
          onClick={() => state !== 'unavailable' && onToggle([id])}
        >
          {cell.column}
        </div>
      );
    }
    const state = seatState(row, cell.columnStart, occupied, selected);
    const idA = seatId(row, cell.columnStart);
    const idB = seatId(row, cell.columnEnd);
    return (
      <div
        key={idA}
        data-testid="couch"
        data-row={row}
        data-column-start={cell.columnStart}
        data-column-end={cell.columnEnd}
        data-state={state}
        className={styles.couch}
        style={{
          gridColumn: `${seatColumnTrack(cell.columnStart)} / span 2`,
          backgroundColor: SEAT_COLORS[state],
        }}
        onClick={() => state !== 'unavailable' && onToggle([idA, idB])}
      >
        {cell.columnStart}-{cell.columnEnd}
      </div>
    );
  }

  const leftCells = cells.filter((cell) => cellBlock(cell) === 0);
  const midCells = cells.filter((cell) => cellBlock(cell) === 1);
  const rightCells = cells.filter((cell) => cellBlock(cell) === 2);

  return (
    <div data-testid="seat-row" data-row={row} className={styles.row}>
      <div data-testid="row-label-left" data-row={row} className={styles.rowLabel} style={{ gridColumn: LEFT_LABEL_TRACK }}>
        {row}
      </div>
      {leftCells.map(renderCell)}
      <div data-testid="aisle" data-row={row} style={{ gridColumn: AISLE_TRACK_1 }} />
      {midCells.map(renderCell)}
      <div data-testid="aisle" data-row={row} style={{ gridColumn: AISLE_TRACK_2 }} />
      {rightCells.map(renderCell)}
      <div
        data-testid="row-label-right"
        data-row={row}
        className={styles.rowLabel}
        style={{ gridColumn: RIGHT_LABEL_TRACK }}
      >
        {row}
      </div>
    </div>
  );
}

export default SeatRow;
