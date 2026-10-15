import { SEAT_STATE_COLORS, SeatState } from '../../seating/state';
import styles from './AuditoriumMap.module.scss';

interface CouchProps {
  row: number;
  colStart: number;
  colEnd: number;
  state: SeatState;
  onClick: () => void;
}

export function Couch({ row, colStart, colEnd, state, onClick }: CouchProps) {
  return (
    <button
      type="button"
      data-testid="couch"
      data-row={row}
      data-column-start={colStart}
      data-column-end={colEnd}
      data-state={state}
      disabled={state === 'unavailable'}
      className={styles.couch}
      style={{ backgroundColor: SEAT_STATE_COLORS[state] }}
      onClick={onClick}
    >
      {colStart}-{colEnd}
    </button>
  );
}
