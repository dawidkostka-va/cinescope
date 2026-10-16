import { SEAT_COLORS, SEAT_STATE_LABELS, SeatState } from '../../utils/colors';

const STATES: SeatState[] = ['available', 'selected', 'unavailable', 'accessible'];

export function Legend() {
  return (
    <div className="legend" data-testid="legend">
      {STATES.map((state) => (
        <div key={state} className="legend-item" data-testid="legend-item" data-state={state}>
          <span className="legend-swatch" style={{ backgroundColor: SEAT_COLORS[state] }} />
          <span>{SEAT_STATE_LABELS[state]}</span>
        </div>
      ))}
    </div>
  );
}

export default Legend;
