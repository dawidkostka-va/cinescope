import Box from '@mui/material/Box';
import { RowCell, ROW_COUNT, SeatState, couchIds, getCouchState, getRowLayout, getSeatState, seatId } from '../../lib/seats';

const SEAT_SIZE = 34;
const GAP = 3;
const COUCH_SIZE = SEAT_SIZE * 2 + GAP;
const LEFT_BLOCK_WIDTH = SEAT_SIZE * 4 + GAP * 3;
const AISLE_WIDTH = SEAT_SIZE * 2;
const LABEL_WIDTH = 28;

const STATE_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

interface AuditoriumProps {
  occupiedSeats: Set<string>;
  selectedSeats: Set<string>;
  onSeatClick: (id: string) => void;
  onCouchClick: (ids: [string, string]) => void;
}

export function Auditorium({ occupiedSeats, selectedSeats, onSeatClick, onCouchClick }: AuditoriumProps) {
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => i + 1);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box
        data-testid="screen-indicator"
        sx={{
          width: '60%',
          maxWidth: 640,
          height: 36,
          mb: 3,
          borderRadius: '50% / 100%',
          bgcolor: '#9e9e9e',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          letterSpacing: 4,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        SCREEN
      </Box>

      <Box data-testid="seat-map" sx={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
        {rows.map((row) => (
          <Row
            key={row}
            row={row}
            occupiedSeats={occupiedSeats}
            selectedSeats={selectedSeats}
            onSeatClick={onSeatClick}
            onCouchClick={onCouchClick}
          />
        ))}
      </Box>
    </Box>
  );
}

interface RowProps {
  row: number;
  occupiedSeats: Set<string>;
  selectedSeats: Set<string>;
  onSeatClick: (id: string) => void;
  onCouchClick: (ids: [string, string]) => void;
}

function Row({ row, occupiedSeats, selectedSeats, onSeatClick, onCouchClick }: RowProps) {
  const layout = getRowLayout(row);

  return (
    <Box data-testid="seat-row" data-row={row} sx={{ display: 'flex', alignItems: 'center', gap: `${GAP}px` }}>
      <RowLabel row={row} side="left" />
      <Block
        cells={layout.leftBlock}
        row={row}
        occupiedSeats={occupiedSeats}
        selectedSeats={selectedSeats}
        onSeatClick={onSeatClick}
        onCouchClick={onCouchClick}
        emptyWidth={LEFT_BLOCK_WIDTH}
      />
      <Aisle row={row} />
      <Block
        cells={layout.middleBlock}
        row={row}
        occupiedSeats={occupiedSeats}
        selectedSeats={selectedSeats}
        onSeatClick={onSeatClick}
        onCouchClick={onCouchClick}
        emptyWidth={0}
      />
      <Aisle row={row} />
      <Block
        cells={layout.rightBlock}
        row={row}
        occupiedSeats={occupiedSeats}
        selectedSeats={selectedSeats}
        onSeatClick={onSeatClick}
        onCouchClick={onCouchClick}
        emptyWidth={0}
      />
      <RowLabel row={row} side="right" />
    </Box>
  );
}

interface BlockProps {
  cells: RowCell[];
  row: number;
  occupiedSeats: Set<string>;
  selectedSeats: Set<string>;
  onSeatClick: (id: string) => void;
  onCouchClick: (ids: [string, string]) => void;
  emptyWidth: number;
}

function Block({ cells, row, occupiedSeats, selectedSeats, onSeatClick, onCouchClick, emptyWidth }: BlockProps) {
  if (cells.length === 0) {
    return <Box sx={{ width: emptyWidth, height: SEAT_SIZE, flexShrink: 0 }} />;
  }
  return (
    <Box sx={{ display: 'flex', gap: `${GAP}px` }}>
      {cells.map((cell) =>
        cell.kind === 'couch' ? (
          <Couch
            key={`${row}-${cell.columnStart}`}
            row={row}
            columnStart={cell.columnStart}
            columnEnd={cell.columnEnd}
            occupiedSeats={occupiedSeats}
            selectedSeats={selectedSeats}
            onCouchClick={onCouchClick}
          />
        ) : (
          <Seat
            key={`${row}-${cell.column}`}
            row={row}
            column={cell.column}
            occupiedSeats={occupiedSeats}
            selectedSeats={selectedSeats}
            onSeatClick={onSeatClick}
          />
        ),
      )}
    </Box>
  );
}

interface SeatProps {
  row: number;
  column: number;
  occupiedSeats: Set<string>;
  selectedSeats: Set<string>;
  onSeatClick: (id: string) => void;
}

function Seat({ row, column, occupiedSeats, selectedSeats, onSeatClick }: SeatProps) {
  const id = seatId(row, column);
  const state = getSeatState(id, row, column, occupiedSeats, selectedSeats);

  return (
    <button
      type="button"
      data-testid="seat"
      data-row={row}
      data-column={column}
      data-state={state}
      onClick={() => {
        if (state !== 'unavailable') onSeatClick(id);
      }}
      style={{
        width: SEAT_SIZE,
        height: SEAT_SIZE,
        flexShrink: 0,
        border: 'none',
        borderRadius: 4,
        backgroundColor: STATE_COLORS[state],
        color: '#fff',
        fontSize: 11,
        cursor: state === 'unavailable' ? 'default' : 'pointer',
        padding: 0,
      }}
    >
      {column}
    </button>
  );
}

interface CouchProps {
  row: number;
  columnStart: number;
  columnEnd: number;
  occupiedSeats: Set<string>;
  selectedSeats: Set<string>;
  onCouchClick: (ids: [string, string]) => void;
}

function Couch({ row, columnStart, columnEnd, occupiedSeats, selectedSeats, onCouchClick }: CouchProps) {
  const ids = couchIds(row, columnStart);
  const state = getCouchState(ids, occupiedSeats, selectedSeats);

  return (
    <button
      type="button"
      data-testid="couch"
      data-row={row}
      data-column-start={columnStart}
      data-column-end={columnEnd}
      data-state={state}
      onClick={() => {
        if (state !== 'unavailable') onCouchClick(ids);
      }}
      style={{
        width: COUCH_SIZE,
        height: SEAT_SIZE,
        flexShrink: 0,
        border: 'none',
        borderRadius: 4,
        backgroundColor: STATE_COLORS[state],
        color: '#fff',
        fontSize: 11,
        cursor: state === 'unavailable' ? 'default' : 'pointer',
        padding: 0,
      }}
    >
      {columnStart}-{columnEnd}
    </button>
  );
}

function RowLabel({ row, side }: { row: number; side: 'left' | 'right' }) {
  return (
    <Box
      data-testid={side === 'left' ? 'row-label-left' : 'row-label-right'}
      data-row={row}
      sx={{ width: LABEL_WIDTH, textAlign: 'center', flexShrink: 0, fontSize: 13, fontWeight: 600 }}
    >
      {row}
    </Box>
  );
}

function Aisle({ row }: { row: number }) {
  return <Box data-testid="aisle" data-row={row} sx={{ width: AISLE_WIDTH, height: SEAT_SIZE, flexShrink: 0 }} />;
}
