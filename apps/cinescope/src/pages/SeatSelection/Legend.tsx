import { SEAT_COLORS, SeatState } from '../../seats/geometry';

const LEGEND_ITEMS: Array<{ state: SeatState; label: string }> = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

export function Legend() {
  return (
    <div className="legend" data-testid="legend">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.state} className="legend__item" data-testid="legend-item" data-state={item.state}>
          <span className="legend__swatch" style={{ backgroundColor: SEAT_COLORS[item.state] }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
