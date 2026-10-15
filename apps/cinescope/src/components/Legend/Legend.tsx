import { SEAT_STATE_COLORS, SeatState } from '../../seating/state';
import styles from './Legend.module.scss';

const LEGEND_ITEMS: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

export function Legend() {
  return (
    <div data-testid="legend" className={styles.legend}>
      {LEGEND_ITEMS.map((item) => (
        <div key={item.state} data-testid="legend-item" data-state={item.state} className={styles.item}>
          <span className={styles.swatch} style={{ backgroundColor: SEAT_STATE_COLORS[item.state] }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
