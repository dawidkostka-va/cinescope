import Box from '@mui/material/Box';
import { SEAT_PX } from './seatMapCells';
import { SeatState, STATE_COLORS } from './colors';

interface CouchProps {
  row: number;
  columnStart: number;
  columnEnd: number;
  state: Exclude<SeatState, 'accessible'>;
  onClick: () => void;
}

export function Couch({ row, columnStart, columnEnd, state, onClick }: CouchProps) {
  const disabled = state === 'unavailable';

  return (
    <Box
      data-testid="couch"
      data-row={row}
      data-column-start={columnStart}
      data-column-end={columnEnd}
      data-state={state}
      onClick={disabled ? undefined : onClick}
      sx={{
        gridColumn: 'span 2',
        width: SEAT_PX * 2,
        height: SEAT_PX,
        bgcolor: STATE_COLORS[state],
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        lineHeight: 1,
        borderRadius: '8px',
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
        '&:hover': {
          bgcolor: STATE_COLORS[state],
        },
      }}
    >
      {`${columnStart}-${columnEnd}`}
    </Box>
  );
}
