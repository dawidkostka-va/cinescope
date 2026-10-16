import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { toSelectionUnits } from '../../lib/seats';

interface SelectedSeatsPanelProps {
  selectedSeats: string[];
}

export function SelectedSeatsPanel({ selectedSeats }: SelectedSeatsPanelProps) {
  const units = toSelectionUnits(selectedSeats);

  const rowMap = new Map<number, string[]>();
  for (const unit of units) {
    const descriptor =
      unit.endColumn !== undefined ? `${unit.startColumn}-${unit.endColumn}` : `${unit.startColumn}`;
    const list = rowMap.get(unit.row) ?? [];
    list.push(descriptor);
    rowMap.set(unit.row, list);
  }
  const rows = [...rowMap.keys()].sort((a, b) => a - b);

  return (
    <Box data-testid="selected-seats" sx={{ my: 3 }}>
      <Typography data-testid="selected-seats-count">
        Selected seats: {selectedSeats.length}
      </Typography>
      {rows.map((row) => (
        <Typography key={row} data-testid="selected-seats-row" data-row={row}>
          Row {row}: {rowMap.get(row)?.join(', ')}
        </Typography>
      ))}
    </Box>
  );
}
