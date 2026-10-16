import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SeatState } from '../../lib/seats';
import { SEAT_COLORS } from './colors';

const ITEMS: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

export function Legend() {
  return (
    <Stack data-testid="legend" direction="row" spacing={3} sx={{ my: 3 }}>
      {ITEMS.map((item) => (
        <Stack
          key={item.state}
          data-testid="legend-item"
          data-state={item.state}
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center' }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              borderRadius: 4,
              backgroundColor: SEAT_COLORS[item.state],
            }}
          />
          <Typography variant="body2">{item.label}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
