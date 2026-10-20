import { getCouchState, getRowCells, getSeatState, isAccessibleSeat, seatId, STATE_COLORS, TOTAL_ROWS } from '../../domain/seatLayout';
import styles from './SeatMap.module.scss';

interface SeatMapProps {
  occupied: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  onToggleSeat: (id: string) => void;
  onToggleCouch: (idA: string, idB: string) => void;
}

export function SeatMap({ occupied, selected, onToggleSeat, onToggleCouch }: SeatMapProps) {
  const rows = Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1);

  return (
    <div data-testid="seat-map" className={styles.seatMap}>
      {rows.map((row) => (
        <div key={row} data-testid="seat-row" data-row={row} className={styles.row}>
          <span data-testid="row-label-left" data-row={row} className={styles.rowLabel}>
            {row}
          </span>
          <div className={styles.cells}>
            {getRowCells(row).map((cell, index) => {
              if (cell.type === 'entrance') {
                return <div key={index} className={styles.entrance} />;
              }
              if (cell.type === 'aisle') {
                return <div key={index} data-testid="aisle" data-row={row} className={styles.aisle} />;
              }
              if (cell.type === 'seat') {
                const accessible = isAccessibleSeat(cell.row, cell.column);
                const id = seatId(cell.row, cell.column);
                const state = getSeatState(id, occupied, selected, accessible);
                return (
                  <div
                    key={index}
                    data-testid="seat"
                    data-row={cell.row}
                    data-column={cell.column}
                    data-state={state}
                    className={styles.seat}
                    style={{ backgroundColor: STATE_COLORS[state] }}
                    onClick={() => {
                      if (state !== 'unavailable') onToggleSeat(id);
                    }}
                  >
                    {cell.column}
                  </div>
                );
              }
              const idA = seatId(cell.row, cell.columnStart);
              const idB = seatId(cell.row, cell.columnEnd);
              const state = getCouchState(idA, idB, occupied, selected);
              return (
                <div
                  key={index}
                  data-testid="couch"
                  data-row={cell.row}
                  data-column-start={cell.columnStart}
                  data-column-end={cell.columnEnd}
                  data-state={state}
                  className={styles.couch}
                  style={{ backgroundColor: STATE_COLORS[state] }}
                  onClick={() => {
                    if (state !== 'unavailable') onToggleCouch(idA, idB);
                  }}
                >
                  {cell.columnStart}-{cell.columnEnd}
                </div>
              );
            })}
          </div>
          <span data-testid="row-label-right" data-row={row} className={styles.rowLabel}>
            {row}
          </span>
        </div>
      ))}
    </div>
  );
}
