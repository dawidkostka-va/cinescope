import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SeatState, SEAT_COLORS } from '../../utils/auditorium';

const LEGEND_ITEMS: Array<{ state: SeatState; label: string }> = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

export function Legend() {
  return (
    <Box data-testid="legend" sx={{ display: 'flex', gap: 3, justifyContent: 'center', my: 2 }}>
      {LEGEND_ITEMS.map((item) => (
        <Box
          key={item.state}
          data-testid="legend-item"
          data-state={item.state}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '4px',
              backgroundColor: SEAT_COLORS[item.state],
            }}
          />
          <Typography variant="body2">{item.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}
