import type { SeatState } from '../../domain/seatMap';

const LEGEND_ITEMS: { state: SeatState; label: string; color: string }[] = [
  { state: 'available', label: 'Available', color: '#2E7D32' },
  { state: 'selected', label: 'Selected', color: '#F9A825' },
  { state: 'unavailable', label: 'Unavailable', color: '#C62828' },
  { state: 'accessible', label: 'Accessible', color: '#1565C0' },
];

export function Legend() {
  return (
    <div data-testid="legend" className="legend">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.state} data-testid="legend-item" data-state={item.state} className="legend-item">
          <span className="legend-swatch" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
