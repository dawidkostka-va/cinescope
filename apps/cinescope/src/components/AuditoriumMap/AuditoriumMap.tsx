import { useMemo } from 'react';
import {
  COUCH_ROW,
  ROW_COUNT,
  getRowBlocks,
  isAccessibleSeat,
  range,
  seatId,
  toCouchPairs,
} from '../../seating/layout';
import { computeCouchState, computeSeatState } from '../../seating/state';
import { Seat } from './Seat';
import { Couch } from './Couch';
import styles from './AuditoriumMap.module.scss';

interface AuditoriumMapProps {
  occupiedSeats: string[];
  selectedSeats: string[];
  onToggle: (ids: string[]) => void;
}

export function AuditoriumMap({ occupiedSeats, selectedSeats, onToggle }: AuditoriumMapProps) {
  const occupied = useMemo(() => new Set(occupiedSeats), [occupiedSeats]);
  const selected = useMemo(() => new Set(selectedSeats), [selectedSeats]);

  const rows = useMemo(() => range(1, ROW_COUNT), []);

  function renderBlock(cols: number[], row: number, sizeClass: string, key: string) {
    if (cols.length === 0) {
      return <div key={key} className={`${styles.spacer} ${sizeClass}`} />;
    }

    if (row === COUCH_ROW) {
      const pairs = toCouchPairs(cols);
      return (
        <div key={key} className={`${styles.block} ${sizeClass}`}>
          {pairs.map(([colStart, colEnd]) => {
            const ids = [seatId(row, colStart), seatId(row, colEnd)];
            const isOccupied = ids.some((id) => occupied.has(id));
            const isSelected = ids.every((id) => selected.has(id));
            const state = computeCouchState(isOccupied, isSelected);
            return (
              <Couch
                key={colStart}
                row={row}
                colStart={colStart}
                colEnd={colEnd}
                state={state}
                onClick={() => onToggle(ids)}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div key={key} className={`${styles.block} ${sizeClass}`}>
        {cols.map((col) => {
          const id = seatId(row, col);
          const state = computeSeatState(isAccessibleSeat(row, col), occupied.has(id), selected.has(id));
          return <Seat key={col} row={row} col={col} state={state} onClick={() => onToggle([id])} />;
        })}
      </div>
    );
  }

  return (
    <>
      <div data-testid="screen-indicator" className={styles.screen}>
        SCREEN
      </div>
      <div data-testid="seat-map" className={styles.map}>
        {rows.map((row) => {
          const blocks = getRowBlocks(row);
          return (
            <div key={row} data-testid="seat-row" data-row={row} className={styles.row}>
              <span data-testid="row-label-left" data-row={row} className={styles.rowLabel}>
                {row}
              </span>
              {renderBlock(blocks.left, row, styles.blockSmall, 'left')}
              <div data-testid="aisle" data-row={row} className={styles.aisle} />
              {renderBlock(blocks.middle, row, styles.blockLarge, 'middle')}
              <div data-testid="aisle" data-row={row} className={styles.aisle} />
              {renderBlock(blocks.right, row, styles.blockSmall, 'right')}
              <span data-testid="row-label-right" data-row={row} className={styles.rowLabel}>
                {row}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
