import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { fetchMovie, fetchScreening } from '../../lib/api';
import { Movie, Screening } from '../../lib/types';
import { useBooking } from '../../lib/booking-context';
import { useToast } from '../../lib/toast-context';
import { formatShowDate } from '../../lib/date';
import {
  columnTrack,
  computeSelectionUnits,
  couchState,
  seatId,
  seatState,
  unitSeatLabel,
} from '../../lib/seat-geometry';
import './seat-selection.scss';

const LEGEND_ITEMS: { state: 'available' | 'selected' | 'unavailable' | 'accessible'; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

const ROWS = Array.from({ length: 15 }, (_, i) => i + 1);
const BLOCK1_COLUMNS = [1, 2, 3, 4];
const BLOCK2_COLUMNS = Array.from({ length: 16 }, (_, i) => i + 5);
const BLOCK3_COLUMNS = [21, 22, 23, 24];

export function SeatSelection() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, startBooking, toggleUnit, clearBooking } = useBooking();
  const { showToast } = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [, setMovie] = useState<Movie | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setScreening(null);
    setFailed(false);
    fetchScreening(screeningId)
      .then((loadedScreening) =>
        fetchMovie(loadedScreening.movieId).then((loadedMovie) => {
          if (cancelled) return;
          setMovie(loadedMovie);
          setScreening(loadedScreening);
          startBooking(screeningId);
        }),
      )
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  useEffect(() => {
    if (failed) {
      navigate('/', { replace: true });
    }
  }, [failed, navigate]);

  const occupied = useMemo(() => new Set(screening?.occupiedSeats ?? []), [screening]);
  const selected = useMemo(
    () => new Set(booking && booking.screeningId === screeningId ? booking.seats : []),
    [booking, screeningId],
  );

  const units = useMemo(
    () => computeSelectionUnits(Array.from(selected)),
    [selected],
  );
  const rowLines = useMemo(() => {
    const byRow = new Map<number, string[]>();
    for (const unit of units) {
      const labels = byRow.get(unit.row) ?? [];
      labels.push(unitSeatLabel(unit));
      byRow.set(unit.row, labels);
    }
    return Array.from(byRow.entries())
      .sort(([a], [b]) => a - b)
      .map(([row, labels]) => ({ row, text: labels.join(', ') }));
  }, [units]);
  const selectedCount = booking && booking.screeningId === screeningId ? booking.seats.length : 0;

  if (!screening) {
    return null;
  }

  const handleToggle = (ids: string[]) => {
    const result = toggleUnit(ids);
    if (result === 'blocked') {
      showToast('Maximum 10 seats per booking');
    }
  };

  const handleCancel = () => {
    clearBooking();
    navigate('/');
  };

  const handleContinue = () => {
    if (selectedCount === 0) return;
    navigate(`/screenings/${screeningId}/summary`);
  };

  const renderSeat = (row: number, column: number) => {
    const state = seatState(row, column, occupied, selected);
    return (
      <div
        key={column}
        data-testid="seat"
        data-row={row}
        data-column={column}
        data-state={state}
        className={`seat seat--${state}`}
        style={{ gridColumn: columnTrack(column) }}
        onClick={() => {
          if (state === 'unavailable') return;
          handleToggle([seatId(row, column)]);
        }}
      >
        {column}
      </div>
    );
  };

  const renderCouch = (row: number, startColumn: number) => {
    const state = couchState(row, startColumn, occupied, selected);
    const idA = seatId(row, startColumn);
    const idB = seatId(row, startColumn + 1);
    return (
      <div
        key={startColumn}
        data-testid="couch"
        data-row={row}
        data-column-start={startColumn}
        data-column-end={startColumn + 1}
        data-state={state}
        className={`couch couch--${state}`}
        style={{ gridColumn: `${columnTrack(startColumn)} / span 2` }}
        onClick={() => {
          if (state === 'unavailable') return;
          handleToggle([idA, idB]);
        }}
      >
        {startColumn}-{startColumn + 1}
      </div>
    );
  };

  const renderRow = (row: number) => {
    const isCouchRow = row === 15;
    const hasEntranceBlock = row >= 1 && row <= 10;

    return (
      <div className="seat-row" data-testid="seat-row" data-row={row} key={row}>
        <div className="row-label" data-testid="row-label-left" data-row={row} style={{ gridColumn: 1 }}>
          {row}
        </div>

        {isCouchRow &&
          [1, 3].map((start) => renderCouch(row, start))}
        {!isCouchRow && !hasEntranceBlock && BLOCK1_COLUMNS.map((column) => renderSeat(row, column))}

        <div className="aisle" data-testid="aisle" data-row={row} style={{ gridColumn: 6 }} />

        {isCouchRow &&
          [5, 7, 9, 11, 13, 15, 17, 19].map((start) => renderCouch(row, start))}
        {!isCouchRow && BLOCK2_COLUMNS.map((column) => renderSeat(row, column))}

        <div className="aisle" data-testid="aisle" data-row={row} style={{ gridColumn: 23 }} />

        {isCouchRow && [21, 23].map((start) => renderCouch(row, start))}
        {!isCouchRow && BLOCK3_COLUMNS.map((column) => renderSeat(row, column))}

        <div
          className="row-label"
          data-testid="row-label-right"
          data-row={row}
          style={{ gridColumn: 28 }}
        >
          {row}
        </div>
      </div>
    );
  };

  return (
    <div className="seat-selection-page">
      <h1 data-testid="seat-map-title">Choose your seats</h1>
      <h2 data-testid="seat-map-subtitle">
        Show Date: {formatShowDate(screening.date, screening.time)}
      </h2>
      <p className="seat-limit-info" data-testid="seat-limit-info">
        You can reserve up to 10 seats per reservation
      </p>

      <div className="auditorium">
        <div className="screen-indicator" data-testid="screen-indicator">
          SCREEN
        </div>
        <div className="seat-map" data-testid="seat-map">
          {ROWS.map((row) => renderRow(row))}
        </div>
      </div>

      <div className="legend" data-testid="legend">
        {LEGEND_ITEMS.map((item) => (
          <div className="legend-item" data-testid="legend-item" data-state={item.state} key={item.state}>
            <span className={`legend-swatch legend-swatch--${item.state}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="selected-seats" data-testid="selected-seats">
        <div data-testid="selected-seats-count">Selected seats: {selectedCount}</div>
        {rowLines.map((line) => (
          <div key={line.row} data-testid="selected-seats-row" data-row={line.row}>
            Row {line.row}: {line.text}
          </div>
        ))}
      </div>

      <div className="actions">
        <Button data-testid="cancel-button" variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          data-testid="continue-button"
          variant="contained"
          disabled={selectedCount === 0}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

export default SeatSelection;
