import { LEGEND_ORDER, SEAT_STATE_COLORS, SEAT_STATE_LABELS } from '../../domain/seatColors';

export function Legend() {
  return (
    <div className="legend" data-testid="legend">
      {LEGEND_ORDER.map((state) => (
        <div key={state} className="legend-item" data-testid="legend-item" data-state={state}>
          <span className="legend-swatch" style={{ backgroundColor: SEAT_STATE_COLORS[state] }} />
          <span>{SEAT_STATE_LABELS[state]}</span>
        </div>
      ))}
    </div>
  );
}
