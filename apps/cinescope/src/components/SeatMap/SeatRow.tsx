import {
  COLUMN_COUNT,
  columnExistsOnRow,
  computeCouchState,
  computeSeatState,
  couchSeatIds,
  isAccessibleSeat,
  isCouchRow,
  seatId,
} from '../../lib/seats';
import { AISLE_1_TRACKS, AISLE_2_TRACKS, GRID_TEMPLATE_COLUMNS } from './gridLayout';
import { Seat } from './Seat';
import { Couch } from './Couch';
import { RowLabel } from './RowLabel';
import { Aisle } from './Aisle';

interface SeatRowProps {
  row: number;
  occupiedSeats: ReadonlySet<string>;
  selectedSeats: ReadonlySet<string>;
  onToggle: (seatIds: string[]) => void;
}

const COUCH_STARTS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];

export function SeatRow({ row, occupiedSeats, selectedSeats, onToggle }: SeatRowProps) {
  const columns: number[] = [];
  for (let column = 1; column <= COLUMN_COUNT; column++) {
    if (columnExistsOnRow(row, column)) {
      columns.push(column);
    }
  }

  return (
    <div
      data-testid="seat-row"
      data-row={row}
      style={{
        display: 'grid',
        gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
        gridAutoRows: 28,
        alignItems: 'center',
      }}
    >
      <RowLabel row={row} side="left" />

      <Aisle row={row} gridColumn={`${AISLE_1_TRACKS[0]} / ${AISLE_1_TRACKS[1] + 1}`} />
      <Aisle row={row} gridColumn={`${AISLE_2_TRACKS[0]} / ${AISLE_2_TRACKS[1] + 1}`} />

      {isCouchRow(row)
        ? COUCH_STARTS.map((start) => {
            const ids = couchSeatIds(row, start);
            const state = computeCouchState(ids, occupiedSeats, selectedSeats);
            return (
              <Couch
                key={start}
                row={row}
                startColumn={start}
                endColumn={start + 1}
                state={state}
                onClick={() => onToggle(ids)}
              />
            );
          })
        : columns.map((column) => {
            const id = seatId(row, column);
            const accessible = isAccessibleSeat(row, column);
            const state = computeSeatState(id, occupiedSeats, selectedSeats, accessible);
            return (
              <Seat
                key={column}
                row={row}
                column={column}
                state={state}
                onClick={() => onToggle([id])}
              />
            );
          })}

      <RowLabel row={row} side="right" />
    </div>
  );
}
