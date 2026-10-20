import Box from '@mui/material/Box';
import { buildRowCells, ROW_GRID_TEMPLATE_COLUMNS, ROW_LABEL_PX } from './seatMapCells';
import { Seat } from './Seat';
import { Couch } from './Couch';
import { SeatState } from './colors';
import { seatId } from '../../utils/seats';

interface SeatRowProps {
  row: number;
  occupiedSeats: Set<string>;
  selectedSeats: Set<string>;
  onToggleSeat: (id: string) => void;
  onToggleCouch: (id1: string, id2: string) => void;
}

function seatState(id: string, occupied: Set<string>, selected: Set<string>, accessible: boolean): SeatState {
  if (occupied.has(id)) return 'unavailable';
  if (selected.has(id)) return 'selected';
  if (accessible) return 'accessible';
  return 'available';
}

function couchState(
  id1: string,
  id2: string,
  occupied: Set<string>,
  selected: Set<string>,
): Exclude<SeatState, 'accessible'> {
  if (occupied.has(id1) || occupied.has(id2)) return 'unavailable';
  if (selected.has(id1) || selected.has(id2)) return 'selected';
  return 'available';
}

export function SeatRow({ row, occupiedSeats, selectedSeats, onToggleSeat, onToggleCouch }: SeatRowProps) {
  const cells = buildRowCells(row);

  return (
    <Box
      data-testid="seat-row"
      data-row={row}
      sx={{
        display: 'grid',
        gridTemplateColumns: ROW_GRID_TEMPLATE_COLUMNS,
        alignItems: 'center',
        gap: '4px',
        mb: '4px',
      }}
    >
      <Box
        data-testid="row-label-left"
        data-row={row}
        sx={{ width: ROW_LABEL_PX, textAlign: 'center', fontSize: 12 }}
      >
        {row}
      </Box>

      {cells.map((cell, index) => {
        if (cell.kind === 'empty') {
          return <Box key={index} />;
        }
        if (cell.kind === 'aisle') {
          return <Box key={index} data-testid="aisle" data-row={row} />;
        }
        if (cell.kind === 'seat') {
          const id = seatId(row, cell.column);
          return (
            <Seat
              key={index}
              row={row}
              column={cell.column}
              state={seatState(id, occupiedSeats, selectedSeats, cell.accessible)}
              onClick={() => onToggleSeat(id)}
            />
          );
        }
        const id1 = seatId(row, cell.columnStart);
        const id2 = seatId(row, cell.columnEnd);
        return (
          <Couch
            key={index}
            row={row}
            columnStart={cell.columnStart}
            columnEnd={cell.columnEnd}
            state={couchState(id1, id2, occupiedSeats, selectedSeats)}
            onClick={() => onToggleCouch(id1, id2)}
          />
        );
      })}

      <Box
        data-testid="row-label-right"
        data-row={row}
        sx={{ width: ROW_LABEL_PX, textAlign: 'center', fontSize: 12 }}
      >
        {row}
      </Box>
    </Box>
  );
}
