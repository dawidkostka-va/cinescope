import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SeatState } from '../../lib/seats';

const ITEMS: Array<{ state: SeatState; label: string; color: string }> = [
  { state: 'available', label: 'Available', color: '#2E7D32' },
  { state: 'selected', label: 'Selected', color: '#F9A825' },
  { state: 'unavailable', label: 'Unavailable', color: '#C62828' },
  { state: 'accessible', label: 'Accessible', color: '#1565C0' },
];

export function Legend() {
  return (
    <Box data-testid="legend" sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 3 }}>
      {ITEMS.map((item) => (
        <Box key={item.state} data-testid="legend-item" data-state={item.state} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: item.color }} />
          <Typography variant="body2">{item.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}
