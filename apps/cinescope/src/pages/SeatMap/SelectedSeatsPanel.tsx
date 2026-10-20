import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { formatUnitSeatLabel, getSortedSelectedUnits } from '../../domain/seatSelection';

interface SelectedSeatsPanelProps {
  seats: string[];
}

export function SelectedSeatsPanel({ seats }: SelectedSeatsPanelProps) {
  const units = getSortedSelectedUnits(seats);
  const rows: { row: number; labels: string[] }[] = [];
  for (const unit of units) {
    const last = rows[rows.length - 1];
    const label = formatUnitSeatLabel(unit);
    if (last && last.row === unit.row) {
      last.labels.push(label);
    } else {
      rows.push({ row: unit.row, labels: [label] });
    }
  }

  return (
    <Box data-testid="selected-seats" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
      <Typography data-testid="selected-seats-count">Selected seats: {seats.length}</Typography>
      {rows.map(({ row, labels }) => (
        <Typography key={row} data-testid="selected-seats-row" data-row={row}>
          Row {row}: {labels.join(', ')}
        </Typography>
      ))}
    </Box>
  );
}
