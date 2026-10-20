import { buildSelectedSeatsRows } from '../../domain/seatLayout';
import styles from './SelectedSeatsPanel.module.scss';

export function SelectedSeatsPanel({ selected }: { selected: readonly string[] }) {
  const rows = buildSelectedSeatsRows(selected);

  return (
    <div data-testid="selected-seats" className={styles.panel}>
      <div data-testid="selected-seats-count">Selected seats: {selected.length}</div>
      {rows.map((row) => (
        <div key={row.row} data-testid="selected-seats-row" data-row={row.row}>
          Row {row.row}: {row.label}
        </div>
      ))}
    </div>
  );
}
