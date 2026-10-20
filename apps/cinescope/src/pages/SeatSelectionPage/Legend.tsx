import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SeatState } from '../../seatUtils';

const LEGEND_ITEMS: { state: SeatState; label: string; color: string }[] = [
  { state: 'available', label: 'Available', color: '#2E7D32' },
  { state: 'selected', label: 'Selected', color: '#F9A825' },
  { state: 'unavailable', label: 'Unavailable', color: '#C62828' },
  { state: 'accessible', label: 'Accessible', color: '#1565C0' },
];

export function Legend() {
  return (
    <Stack data-testid="legend" direction="row" spacing={3} sx={{ justifyContent: 'center' }}>
      {LEGEND_ITEMS.map(({ state, label, color }) => (
        <Stack
          key={state}
          data-testid="legend-item"
          data-state={state}
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center' }}
        >
          <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: color }} />
          <Typography variant="body2">{label}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
