import { SEAT_STATE_COLORS, SeatState } from '../../seating/state';
import styles from './AuditoriumMap.module.scss';

interface SeatProps {
  row: number;
  col: number;
  state: SeatState;
  onClick: () => void;
}

export function Seat({ row, col, state, onClick }: SeatProps) {
  return (
    <button
      type="button"
      data-testid="seat"
      data-row={row}
      data-column={col}
      data-state={state}
      disabled={state === 'unavailable'}
      className={styles.seat}
      style={{ backgroundColor: SEAT_STATE_COLORS[state] }}
      onClick={onClick}
    >
      {col}
    </button>
  );
}
