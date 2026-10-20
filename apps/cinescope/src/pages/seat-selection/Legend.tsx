import { LEGEND_ITEMS, STATE_COLORS } from '../../domain/seatLayout';
import styles from './Legend.module.scss';

export function Legend() {
  return (
    <div data-testid="legend" className={styles.legend}>
      {LEGEND_ITEMS.map((item) => (
        <div key={item.state} data-testid="legend-item" data-state={item.state} className={styles.legendItem}>
          <span className={styles.swatch} style={{ backgroundColor: STATE_COLORS[item.state] }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
