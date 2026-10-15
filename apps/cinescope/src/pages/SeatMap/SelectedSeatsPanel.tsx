import Typography from '@mui/material/Typography';
import { selectedSeatsByRow } from '../../lib/seats';
import styles from './SeatMap.module.scss';

export function SelectedSeatsPanel({ seats }: { seats: string[] }) {
  const rows = selectedSeatsByRow(seats);
  return (
    <div data-testid="selected-seats" className={styles.selectedPanel}>
      <Typography data-testid="selected-seats-count">Selected seats: {seats.length}</Typography>
      {rows.map(({ row, label }) => (
        <Typography key={row} data-testid="selected-seats-row" data-row={row}>
          Row {row}: {label}
        </Typography>
      ))}
    </div>
  );
}

export default SelectedSeatsPanel;
