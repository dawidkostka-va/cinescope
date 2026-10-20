import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getBookingItems } from '../../seatUtils';

interface SelectedSeatsPanelProps {
  seatIds: string[];
}

export function SelectedSeatsPanel({ seatIds }: SelectedSeatsPanelProps) {
  const items = getBookingItems(seatIds);
  const rows = new Map<number, string[]>();
  for (const item of items) {
    const list = rows.get(item.row) ?? [];
    list.push(item.type === 'couch' ? `${item.columnStart}-${item.columnEnd}` : `${item.column}`);
    rows.set(item.row, list);
  }
  const rowNumbers = [...rows.keys()].sort((a, b) => a - b);

  return (
    <Box data-testid="selected-seats">
      <Typography data-testid="selected-seats-count">Selected seats: {seatIds.length}</Typography>
      {rowNumbers.map((row) => (
        <Typography key={row} data-testid="selected-seats-row" data-row={row}>
          Row {row}: {rows.get(row)?.join(', ')}
        </Typography>
      ))}
    </Box>
  );
}
