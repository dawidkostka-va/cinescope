import Box from '@mui/material/Box';
import { SEAT_PX } from './seatMapCells';
import { SeatState, STATE_COLORS } from './colors';

interface SeatProps {
  row: number;
  column: number;
  state: SeatState;
  onClick: () => void;
}

export function Seat({ row, column, state, onClick }: SeatProps) {
  const disabled = state === 'unavailable';

  return (
    <Box
      data-testid="seat"
      data-row={row}
      data-column={column}
      data-state={state}
      onClick={disabled ? undefined : onClick}
      sx={{
        width: SEAT_PX,
        height: SEAT_PX,
        bgcolor: STATE_COLORS[state],
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        lineHeight: 1,
        borderRadius: '4px',
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
        '&:hover': {
          bgcolor: STATE_COLORS[state],
        },
      }}
    >
      {column}
    </Box>
  );
}
