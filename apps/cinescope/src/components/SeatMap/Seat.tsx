import { SeatState } from '../../lib/seats';
import { columnTrack, trackSpan } from './gridLayout';
import { SEAT_COLORS } from './colors';

interface SeatProps {
  row: number;
  column: number;
  state: SeatState;
  onClick: () => void;
}

export function Seat({ row, column, state, onClick }: SeatProps) {
  return (
    <button
      type="button"
      data-testid="seat"
      data-row={row}
      data-column={column}
      data-state={state}
      disabled={state === 'unavailable'}
      onClick={onClick}
      style={{
        gridColumn: trackSpan(columnTrack(column)),
        backgroundColor: SEAT_COLORS[state],
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        fontSize: 11,
        padding: 0,
        cursor: state === 'unavailable' ? 'default' : 'pointer',
      }}
    >
      {column}
    </button>
  );
}
