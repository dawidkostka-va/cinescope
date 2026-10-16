import { useMemo } from 'react';
import {
  TOTAL_ROWS,
  rowColumns,
  isCouchRow,
  couchPairs,
  seatId,
  getSeatState,
  getCouchState,
  gridColumnStart,
  SEAT_COLORS,
} from '../../utils/auditorium';
import styles from './Auditorium.module.scss';

const GRID_TEMPLATE_COLUMNS = '32px repeat(4, 32px) 64px repeat(16, 32px) 64px repeat(4, 32px) 32px';
const ROW_LABEL_LEFT_COLUMN = 1;
const AISLE_1_COLUMN = 6;
const AISLE_2_COLUMN = 23;
const ROW_LABEL_RIGHT_COLUMN = 28;

interface AuditoriumProps {
  occupiedSeats: readonly string[];
  selectedSeats: readonly string[];
  onToggle: (ids: string[]) => void;
}

export function Auditorium({ occupiedSeats, selectedSeats, onToggle }: AuditoriumProps) {
  const occupied = useMemo(() => new Set(occupiedSeats), [occupiedSeats]);
  const selected = useMemo(() => new Set(selectedSeats), [selectedSeats]);
  const rows = useMemo(() => Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1), []);

  return (
    <div data-testid="seat-map" className={styles.seatMap}>
      {rows.map((row) => (
        <div
          key={row}
          data-testid="seat-row"
          data-row={row}
          className={styles.seatRow}
          style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
        >
          <div
            data-testid="row-label-left"
            data-row={row}
            className={styles.rowLabel}
            style={{ gridColumn: ROW_LABEL_LEFT_COLUMN }}
          >
            {row}
          </div>
          <div data-testid="aisle" data-row={row} style={{ gridColumn: AISLE_1_COLUMN }} />
          <div data-testid="aisle" data-row={row} style={{ gridColumn: AISLE_2_COLUMN }} />
          <div
            data-testid="row-label-right"
            data-row={row}
            className={styles.rowLabel}
            style={{ gridColumn: ROW_LABEL_RIGHT_COLUMN }}
          >
            {row}
          </div>
          {isCouchRow(row)
            ? couchPairs().map(([start, end]) => {
                const ids: [string, string] = [seatId(row, start), seatId(row, end)];
                const state = getCouchState(ids, occupied, selected);
                return (
                  <button
                    key={`${start}-${end}`}
                    type="button"
                    data-testid="couch"
                    data-row={row}
                    data-column-start={start}
                    data-column-end={end}
                    data-state={state}
                    disabled={state === 'unavailable'}
                    className={styles.couch}
                    style={{
                      gridColumn: `${gridColumnStart(start)} / span 2`,
                      backgroundColor: SEAT_COLORS[state],
                    }}
                    onClick={() => onToggle(ids)}
                  >
                    {`${start}-${end}`}
                  </button>
                );
              })
            : rowColumns(row).map((column) => {
                const id = seatId(row, column);
                const state = getSeatState(row, column, occupied, selected);
                return (
                  <button
                    key={column}
                    type="button"
                    data-testid="seat"
                    data-row={row}
                    data-column={column}
                    data-state={state}
                    disabled={state === 'unavailable'}
                    className={styles.seat}
                    style={{ gridColumn: gridColumnStart(column), backgroundColor: SEAT_COLORS[state] }}
                    onClick={() => onToggle([id])}
                  >
                    {column}
                  </button>
                );
              })}
        </div>
      ))}
    </div>
  );
}
