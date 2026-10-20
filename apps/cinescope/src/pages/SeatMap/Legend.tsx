import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { LEGEND_ORDER, STATE_COLORS, STATE_LABELS } from './colors';

export function Legend() {
  return (
    <Box data-testid="legend" sx={{ display: 'flex', gap: 3, justifyContent: 'center', my: 2 }}>
      {LEGEND_ORDER.map((state) => (
        <Box
          key={state}
          data-testid="legend-item"
          data-state={state}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Box sx={{ width: 16, height: 16, bgcolor: STATE_COLORS[state], borderRadius: '4px' }} />
          <Typography variant="body2">{STATE_LABELS[state]}</Typography>
        </Box>
      ))}
    </Box>
  );
}
