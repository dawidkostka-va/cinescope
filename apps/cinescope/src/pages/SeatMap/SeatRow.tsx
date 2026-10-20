import { buildRowCells, getCellState, getSeatIdsForCell } from '../../domain/seatLayout';
import { SEAT_STATE_COLORS } from '../../domain/seatColors';

interface SeatRowProps {
  row: number;
  selected: ReadonlySet<string>;
  occupied: ReadonlySet<string>;
  onToggle: (ids: string[]) => void;
}

export function SeatRow({ row, selected, occupied, onToggle }: SeatRowProps) {
  const cells = buildRowCells(row);

  return (
    <div className="seat-row" data-testid="seat-row" data-row={row}>
      <div className="row-label" data-testid="row-label-left" data-row={row}>
        {row}
      </div>
      <div className="row-body">
        {cells.map((cell, index) => {
          if (cell.kind === 'empty') {
            return <div key={index} className="empty-cell" />;
          }
          if (cell.kind === 'aisle') {
            return <div key={index} className="aisle" data-testid="aisle" data-row={row} />;
          }
          if (cell.kind === 'seat') {
            const ids = getSeatIdsForCell(cell);
            const state = getCellState(ids, selected, occupied, cell.accessible);
            return (
              <div
                key={index}
                className="seat"
                data-testid="seat"
                data-row={cell.row}
                data-column={cell.column}
                data-state={state}
                style={{ backgroundColor: SEAT_STATE_COLORS[state] }}
                onClick={() => state !== 'unavailable' && onToggle(ids)}
              >
                {cell.column}
              </div>
            );
          }
          const ids = getSeatIdsForCell(cell);
          const state = getCellState(ids, selected, occupied, false);
          return (
            <div
              key={index}
              className="couch"
              data-testid="couch"
              data-row={cell.row}
              data-column-start={cell.columnStart}
              data-column-end={cell.columnEnd}
              data-state={state}
              style={{ backgroundColor: SEAT_STATE_COLORS[state] }}
              onClick={() => state !== 'unavailable' && onToggle(ids)}
            >
              {cell.columnStart}-{cell.columnEnd}
            </div>
          );
        })}
      </div>
      <div className="row-label" data-testid="row-label-right" data-row={row}>
        {row}
      </div>
    </div>
  );
}
