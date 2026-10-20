import { CSSProperties } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  COUCH_ROW,
  ROW_COUNT,
  couchState,
  couches,
  rowColumns,
  seatState,
  SeatState,
} from '../../seatUtils';
import './AuditoriumMap.scss';

const SEAT_WIDTH = '2.2rem';
const AISLE_WIDTH = '4.4rem';
const LABEL_WIDTH = '1.5rem';

const GRID_TEMPLATE_COLUMNS = [
  LABEL_WIDTH,
  ...Array(4).fill(SEAT_WIDTH),
  AISLE_WIDTH,
  ...Array(16).fill(SEAT_WIDTH),
  AISLE_WIDTH,
  ...Array(4).fill(SEAT_WIDTH),
  LABEL_WIDTH,
].join(' ');

const LABEL_LEFT_TRACK = 1;
const AISLE_1_TRACK = 6;
const AISLE_2_TRACK = 23;
const LABEL_RIGHT_TRACK = 28;

const STATE_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

function trackForColumn(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

interface AuditoriumMapProps {
  occupiedSeats: ReadonlySet<string>;
  selectedSeats: ReadonlySet<string>;
  onToggleSeat: (row: number, column: number) => void;
  onToggleCouch: (row: number, columnStart: number, columnEnd: number) => void;
}

export function AuditoriumMap({
  occupiedSeats,
  selectedSeats,
  onToggleSeat,
  onToggleCouch,
}: AuditoriumMapProps) {
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => i + 1);

  return (
    <Box
      data-testid="seat-map"
      className="seat-map"
      style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
    >
      {rows.map((row) => (
        <div key={row} data-testid="seat-row" data-row={row} style={{ display: 'contents' }}>
          <div
            data-testid="row-label-left"
            data-row={row}
            className="row-label"
            style={{ gridColumn: LABEL_LEFT_TRACK, gridRow: row }}
          >
            {row}
          </div>

          {row === COUCH_ROW
            ? couches().map(([columnStart, columnEnd]) => {
                const state = couchState(row, columnStart, columnEnd, occupiedSeats, selectedSeats);
                const style: CSSProperties = {
                  gridColumn: `${trackForColumn(columnStart)} / span 2`,
                  gridRow: row,
                  ['--seat-bg' as string]: STATE_COLORS[state],
                };
                return (
                  <button
                    key={`${columnStart}-${columnEnd}`}
                    type="button"
                    data-testid="couch"
                    data-row={row}
                    data-column-start={columnStart}
                    data-column-end={columnEnd}
                    data-state={state}
                    className={`seat${state === 'unavailable' ? ' seat--unavailable' : ''}`}
                    style={style}
                    onClick={() => onToggleCouch(row, columnStart, columnEnd)}
                  >
                    {columnStart}-{columnEnd}
                  </button>
                );
              })
            : rowColumns(row).map((column) => {
                const state = seatState(row, column, occupiedSeats, selectedSeats);
                const style: CSSProperties = {
                  gridColumn: trackForColumn(column),
                  gridRow: row,
                  ['--seat-bg' as string]: STATE_COLORS[state],
                };
                return (
                  <button
                    key={column}
                    type="button"
                    data-testid="seat"
                    data-row={row}
                    data-column={column}
                    data-state={state}
                    className={`seat${state === 'unavailable' ? ' seat--unavailable' : ''}`}
                    style={style}
                    onClick={() => onToggleSeat(row, column)}
                  >
                    {column}
                  </button>
                );
              })}

          <div
            data-testid="aisle"
            data-row={row}
            className="aisle"
            style={{ gridColumn: AISLE_1_TRACK, gridRow: row }}
          />
          <div
            data-testid="aisle"
            data-row={row}
            className="aisle"
            style={{ gridColumn: AISLE_2_TRACK, gridRow: row }}
          />

          <div
            data-testid="row-label-right"
            data-row={row}
            className="row-label"
            style={{ gridColumn: LABEL_RIGHT_TRACK, gridRow: row }}
          >
            {row}
          </div>
        </div>
      ))}
    </Box>
  );
}

export function ScreenIndicator() {
  return (
    <Box
      data-testid="screen-indicator"
      sx={{
        mx: 'auto',
        mb: 2,
        width: '60%',
        textAlign: 'center',
        py: 1,
        borderRadius: 1,
        backgroundColor: '#ccc',
      }}
    >
      <Typography variant="overline">SCREEN</Typography>
    </Box>
  );
}
