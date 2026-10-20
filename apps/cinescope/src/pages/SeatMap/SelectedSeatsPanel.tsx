import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { groupSelectedByRow } from '../../utils/seats';

interface SelectedSeatsPanelProps {
  seats: string[];
}

export function SelectedSeatsPanel({ seats }: SelectedSeatsPanelProps) {
  const rows = groupSelectedByRow(seats);

  return (
    <Box data-testid="selected-seats" sx={{ my: 2 }}>
      <Typography data-testid="selected-seats-count">{`Selected seats: ${seats.length}`}</Typography>
      {rows.map(({ row, display }) => (
        <Typography key={row} data-testid="selected-seats-row" data-row={row}>
          {`Row ${row}: ${display}`}
        </Typography>
      ))}
    </Box>
  );
}
