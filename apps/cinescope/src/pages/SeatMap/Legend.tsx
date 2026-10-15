import { SEAT_COLORS, SeatState } from '../../lib/seats';
import styles from './SeatMap.module.scss';

const LEGEND_ITEMS: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

export function Legend() {
  return (
    <div data-testid="legend" className={styles.legend}>
      {LEGEND_ITEMS.map(({ state, label }) => (
        <div key={state} data-testid="legend-item" data-state={state} className={styles.legendItem}>
          <span className={styles.swatch} style={{ backgroundColor: SEAT_COLORS[state] }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default Legend;
