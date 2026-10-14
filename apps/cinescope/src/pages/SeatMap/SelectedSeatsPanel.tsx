import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { buildBookingItems, summarizeByRow } from '../../lib/seats';

export function SelectedSeatsPanel({ selectedIds }: { selectedIds: string[] }) {
  const items = buildBookingItems(selectedIds);
  const rows = summarizeByRow(items);

  return (
    <Box data-testid="selected-seats" sx={{ mt: 3, textAlign: 'center' }}>
      <Typography data-testid="selected-seats-count">Selected seats: {selectedIds.length}</Typography>
      {rows.map(({ row, label }) => (
        <Typography key={row} data-testid="selected-seats-row" data-row={row}>
          Row {row}: {label}
        </Typography>
      ))}
    </Box>
  );
}
