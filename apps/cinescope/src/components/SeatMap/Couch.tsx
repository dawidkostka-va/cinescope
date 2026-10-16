import { SeatState } from '../../lib/seats';
import { columnSpan } from './gridLayout';
import { SEAT_COLORS } from './colors';

interface CouchProps {
  row: number;
  startColumn: number;
  endColumn: number;
  state: Exclude<SeatState, 'accessible'>;
  onClick: () => void;
}

export function Couch({ row, startColumn, endColumn, state, onClick }: CouchProps) {
  return (
    <button
      type="button"
      data-testid="couch"
      data-row={row}
      data-column-start={startColumn}
      data-column-end={endColumn}
      data-state={state}
      disabled={state === 'unavailable'}
      onClick={onClick}
      style={{
        gridColumn: columnSpan(startColumn, endColumn),
        backgroundColor: SEAT_COLORS[state],
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        fontSize: 11,
        padding: 0,
        cursor: state === 'unavailable' ? 'default' : 'pointer',
      }}
    >
      {startColumn}-{endColumn}
    </button>
  );
}
