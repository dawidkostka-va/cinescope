import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovie, fetchScreening } from '../lib/api';
import { clearBooking, ensureBookingForScreening, setBooking, useBooking } from '../lib/bookingStore';
import { formatShowDate } from '../lib/dateUtils';
import {
  AISLE_1_COLUMN,
  AISLE_2_COLUMN,
  Cell,
  LEFT_LABEL_COLUMN,
  MAX_SEATS_PER_BOOKING,
  RIGHT_LABEL_COLUMN,
  ROW_COUNT,
  SEAT_COLORS,
  SeatState,
  blockColumns,
  couchState,
  gridColumn,
  seatId,
  seatState,
  toCells,
} from '../lib/seatLayout';
import { buildTickets } from '../lib/ticketing';
import { useToast } from '../lib/toast';
import { Movie, Screening } from '../lib/types';
import styles from './SeatSelectionPage.module.scss';

interface LoadedData {
  status: 'loading' | 'loaded';
  screening?: Screening;
  movie?: Movie;
}

const LEGEND_ITEMS: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

function SeatCell({
  row,
  cell,
  occupied,
  selected,
  onToggleSeat,
  onToggleCouch,
}: {
  row: number;
  cell: Cell;
  occupied: Set<string>;
  selected: Set<string>;
  onToggleSeat: (id: string) => void;
  onToggleCouch: (a: string, b: string) => void;
}) {
  if (cell.kind === 'seat') {
    const id = seatId(row, cell.column);
    const state = seatState(row, cell.column, occupied.has(id), selected.has(id));
    return (
      <button
        type="button"
        className={styles.seat}
        data-testid="seat"
        data-row={row}
        data-column={cell.column}
        data-state={state}
        style={{ gridColumn: gridColumn(cell.column), backgroundColor: SEAT_COLORS[state] }}
        disabled={state === 'unavailable'}
        onClick={() => onToggleSeat(id)}
      >
        {cell.column}
      </button>
    );
  }

  const [a, b] = cell.columns;
  const idA = seatId(row, a);
  const idB = seatId(row, b);
  const state = couchState(occupied.has(idA), occupied.has(idB), selected.has(idA) && selected.has(idB));
  return (
    <button
      type="button"
      className={styles.couch}
      data-testid="couch"
      data-row={row}
      data-column-start={a}
      data-column-end={b}
      data-state={state}
      style={{
        gridColumn: `${gridColumn(a)} / ${gridColumn(b) + 1}`,
        backgroundColor: SEAT_COLORS[state],
      }}
      disabled={state === 'unavailable'}
      onClick={() => onToggleCouch(idA, idB)}
    >
      {a}-{b}
    </button>
  );
}

function SeatRow({
  row,
  occupied,
  selected,
  onToggleSeat,
  onToggleCouch,
}: {
  row: number;
  occupied: Set<string>;
  selected: Set<string>;
  onToggleSeat: (id: string) => void;
  onToggleCouch: (a: string, b: string) => void;
}) {
  const isCouchRow = row === 15;
  const { a, b, c } = blockColumns(row);
  const cellsA = toCells(a, isCouchRow);
  const cellsB = toCells(b, isCouchRow);
  const cellsC = toCells(c, isCouchRow);

  const cellProps = { row, occupied, selected, onToggleSeat, onToggleCouch };

  return (
    <div className={styles.row} data-testid="seat-row" data-row={row}>
      <div
        className={styles.label}
        data-testid="row-label-left"
        data-row={row}
        style={{ gridColumn: LEFT_LABEL_COLUMN }}
      >
        {row}
      </div>
      {cellsA.map((cell) => (
        <SeatCell key={`a-${cell.kind === 'seat' ? cell.column : cell.columns.join('-')}`} cell={cell} {...cellProps} />
      ))}
      <div data-testid="aisle" data-row={row} style={{ gridColumn: AISLE_1_COLUMN }} />
      {cellsB.map((cell) => (
        <SeatCell key={`b-${cell.kind === 'seat' ? cell.column : cell.columns.join('-')}`} cell={cell} {...cellProps} />
      ))}
      <div data-testid="aisle" data-row={row} style={{ gridColumn: AISLE_2_COLUMN }} />
      {cellsC.map((cell) => (
        <SeatCell key={`c-${cell.kind === 'seat' ? cell.column : cell.columns.join('-')}`} cell={cell} {...cellProps} />
      ))}
      <div
        className={styles.label}
        data-testid="row-label-right"
        data-row={row}
        style={{ gridColumn: RIGHT_LABEL_COLUMN }}
      >
        {row}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className={styles.legend} data-testid="legend">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.state} className={styles.legendItem} data-testid="legend-item" data-state={item.state}>
          <span className={styles.swatch} style={{ backgroundColor: SEAT_COLORS[item.state] }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SelectedSeatsPanel({ seatIds }: { seatIds: string[] }) {
  const tickets = buildTickets(seatIds);
  const rowMap = new Map<number, string[]>();
  for (const ticket of tickets) {
    const description = ticket.kind === 'couch' ? `${ticket.columns[0]}-${ticket.columns[1]}` : `${ticket.columns[0]}`;
    const list = rowMap.get(ticket.row) ?? [];
    list.push(description);
    rowMap.set(ticket.row, list);
  }
  const rows = [...rowMap.keys()].sort((x, y) => x - y);

  return (
    <div className={styles.selectedPanel} data-testid="selected-seats">
      <div data-testid="selected-seats-count">Selected seats: {seatIds.length}</div>
      {rows.map((row) => (
        <div key={row} data-testid="selected-seats-row" data-row={row}>
          Row {row}: {rowMap.get(row)?.join(', ')}
        </div>
      ))}
    </div>
  );
}

export function SeatSelectionPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const booking = useBooking();
  const [data, setData] = useState<LoadedData>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchScreening(screeningId)
      .then((screening) => fetchMovie(screening.movieId).then((movie) => ({ screening, movie })))
      .then(({ screening, movie }) => {
        if (cancelled) return;
        ensureBookingForScreening(screeningId);
        setData({ status: 'loaded', screening, movie });
      })
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [screeningId, navigate]);

  if (data.status !== 'loaded' || !booking || booking.screeningId !== screeningId) {
    return null;
  }

  const screening = data.screening as Screening;
  const currentBooking = booking;
  const occupied = new Set(screening.occupiedSeats);
  const selected = new Set(currentBooking.seats);

  function toggleSeat(targetId: string) {
    if (occupied.has(targetId)) return;
    const already = currentBooking.seats.includes(targetId);
    let nextSeats: string[];
    if (already) {
      nextSeats = currentBooking.seats.filter((s) => s !== targetId);
    } else {
      if (currentBooking.seats.length + 1 > MAX_SEATS_PER_BOOKING) {
        showToast('Maximum 10 seats per booking');
        return;
      }
      nextSeats = [...currentBooking.seats, targetId];
    }
    setBooking({ ...currentBooking, seats: nextSeats });
  }

  function toggleCouch(idA: string, idB: string) {
    if (occupied.has(idA) || occupied.has(idB)) return;
    const already = currentBooking.seats.includes(idA) && currentBooking.seats.includes(idB);
    let nextSeats: string[];
    if (already) {
      nextSeats = currentBooking.seats.filter((s) => s !== idA && s !== idB);
    } else {
      if (currentBooking.seats.length + 2 > MAX_SEATS_PER_BOOKING) {
        showToast('Maximum 10 seats per booking');
        return;
      }
      nextSeats = [...currentBooking.seats, idA, idB];
    }
    setBooking({ ...currentBooking, seats: nextSeats });
  }

  function handleCancel() {
    clearBooking();
    navigate('/');
  }

  function handleContinue() {
    if (currentBooking.seats.length === 0) return;
    navigate(`/screenings/${screeningId}/summary`);
  }

  const rows = Array.from({ length: ROW_COUNT }, (_, i) => i + 1);

  return (
    <div className={styles.page}>
      <h1 data-testid="seat-map-title">Choose your seats</h1>
      <div data-testid="seat-map-subtitle">Show Date: {formatShowDate(screening.date, screening.time)}</div>
      <div className={styles.limitInfo} data-testid="seat-limit-info">
        You can reserve up to 10 seats per reservation
      </div>
      <div className={styles.screen} data-testid="screen-indicator">
        SCREEN
      </div>
      <div className={styles.seatMap} data-testid="seat-map">
        {rows.map((row) => (
          <SeatRow
            key={row}
            row={row}
            occupied={occupied}
            selected={selected}
            onToggleSeat={toggleSeat}
            onToggleCouch={toggleCouch}
          />
        ))}
      </div>
      <Legend />
      <SelectedSeatsPanel seatIds={booking.seats} />
      <div className={styles.actions}>
        <Button data-testid="cancel-button" onClick={handleCancel}>
          Cancel
        </Button>
        <Button data-testid="continue-button" disabled={booking.seats.length === 0} onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export default SeatSelectionPage;
