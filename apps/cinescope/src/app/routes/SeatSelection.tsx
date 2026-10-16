import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { fetchMovie, fetchScreening } from '../api/client';
import { Movie, Screening } from '../api/types';
import { useBooking } from '../booking/BookingContext';
import { useToast } from '../components/Toast';
import { formatShowDate } from '../utils/dates';
import {
  ROW_COUNT,
  STATE_COLORS,
  SeatState,
  buildRowCells,
  formatSelectedSeatsLines,
  isAccessibleSeat,
  seatId,
} from '../utils/seats';

const SEAT_SIZE = 28;

const LEGEND_ITEMS: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

export function SeatSelection() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, ensureBookingForScreening, toggleSeats, clearBooking } = useBooking();
  const showToast = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchScreening(screeningId)
      .then((s) =>
        fetchMovie(s.movieId).then((m) => {
          if (cancelled) return;
          setScreening(s);
          setMovie(m);
          ensureBookingForScreening(s.id);
        }),
      )
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  useEffect(() => {
    if (loadFailed) navigate('/', { replace: true });
  }, [loadFailed, navigate]);

  const occupied = useMemo(() => new Set(screening?.occupiedSeats ?? []), [screening]);

  const ready = !!(screening && movie && booking && booking.screeningId === screeningId);

  const seatLines = useMemo(
    () => (ready && booking ? formatSelectedSeatsLines(booking.seats) : []),
    [ready, booking],
  );

  if (!ready || !screening || !movie || !booking) {
    return null;
  }

  const selected = new Set(booking.seats);
  const selectedCount = booking.seats.length;

  const handleToggle = (ids: string[]) => {
    const ok = toggleSeats(ids);
    if (!ok) {
      showToast('Maximum 10 seats per booking');
    }
  };

  const rows = Array.from({ length: ROW_COUNT }, (_, i) => i + 1);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: 4 }}>
      <Typography data-testid="seat-map-title" variant="h4" align="center">
        Choose your seats
      </Typography>
      <Typography data-testid="seat-map-subtitle" align="center">
        Show Date: {formatShowDate(screening.date, screening.time)}
      </Typography>
      <Typography data-testid="seat-limit-info" align="center" sx={{ mt: 2, mb: 1 }}>
        You can reserve up to 10 seats per reservation
      </Typography>

      <Box
        data-testid="screen-indicator"
        sx={{ textAlign: 'center', bgcolor: '#999', color: '#fff', py: 1, mb: 2, borderRadius: 1 }}
      >
        SCREEN
      </Box>

      <Box data-testid="seat-map" sx={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
        {rows.map((row) => {
          const cells = buildRowCells(row);
          return (
            <Box
              key={row}
              data-testid="seat-row"
              data-row={row}
              sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Box data-testid="row-label-left" data-row={row} sx={{ width: 20, textAlign: 'right', fontSize: 12 }}>
                {row}
              </Box>
              {cells.map((cell, index) => {
                if (cell.kind === 'gap') {
                  return <Box key={index} sx={{ width: SEAT_SIZE * 4 }} />;
                }
                if (cell.kind === 'aisle') {
                  return (
                    <Box
                      key={index}
                      data-testid="aisle"
                      data-row={row}
                      sx={{ width: SEAT_SIZE * 2 }}
                    />
                  );
                }
                if (cell.kind === 'seat') {
                  const thisId = seatId(row, cell.column);
                  const accessible = isAccessibleSeat(row, cell.column);
                  const state: SeatState = occupied.has(thisId)
                    ? 'unavailable'
                    : selected.has(thisId)
                      ? 'selected'
                      : accessible
                        ? 'accessible'
                        : 'available';
                  return (
                    <Box
                      key={index}
                      component="button"
                      type="button"
                      data-testid="seat"
                      data-row={row}
                      data-column={cell.column}
                      data-state={state}
                      onClick={() => {
                        if (state !== 'unavailable') handleToggle([thisId]);
                      }}
                      sx={{
                        width: SEAT_SIZE,
                        height: SEAT_SIZE,
                        bgcolor: STATE_COLORS[state],
                        border: 'none',
                        borderRadius: '4px',
                        cursor: state === 'unavailable' ? 'default' : 'pointer',
                        color: '#fff',
                        fontSize: 10,
                        p: 0,
                      }}
                    >
                      {cell.column}
                    </Box>
                  );
                }
                const idA = seatId(row, cell.columnStart);
                const idB = seatId(row, cell.columnEnd);
                const unavailable = occupied.has(idA) || occupied.has(idB);
                const isSelected = selected.has(idA) && selected.has(idB);
                const state: SeatState = unavailable ? 'unavailable' : isSelected ? 'selected' : 'available';
                return (
                  <Box
                    key={index}
                    component="button"
                    type="button"
                    data-testid="couch"
                    data-row={row}
                    data-column-start={cell.columnStart}
                    data-column-end={cell.columnEnd}
                    data-state={state}
                    onClick={() => {
                      if (state !== 'unavailable') handleToggle([idA, idB]);
                    }}
                    sx={{
                      width: SEAT_SIZE * 2.2,
                      height: SEAT_SIZE,
                      bgcolor: STATE_COLORS[state],
                      border: 'none',
                      borderRadius: '4px',
                      cursor: state === 'unavailable' ? 'default' : 'pointer',
                      color: '#fff',
                      fontSize: 10,
                      p: 0,
                    }}
                  >
                    {cell.columnStart}-{cell.columnEnd}
                  </Box>
                );
              })}
              <Box data-testid="row-label-right" data-row={row} sx={{ width: 20, fontSize: 12 }}>
                {row}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Stack
        data-testid="legend"
        direction="row"
        spacing={3}
        sx={{ my: 3, justifyContent: 'center' }}
      >
        {LEGEND_ITEMS.map((item) => (
          <Stack
            key={item.state}
            data-testid="legend-item"
            data-state={item.state}
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            <Box sx={{ width: 16, height: 16, bgcolor: STATE_COLORS[item.state], borderRadius: '4px' }} />
            <Typography>{item.label}</Typography>
          </Stack>
        ))}
      </Stack>

      <Box data-testid="selected-seats" sx={{ textAlign: 'center', mb: 3 }}>
        <Typography data-testid="selected-seats-count">Selected seats: {selectedCount}</Typography>
        {seatLines.map((line) => (
          <Typography key={line.row} data-testid="selected-seats-row" data-row={line.row}>
            {line.text}
          </Typography>
        ))}
      </Box>

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
        <Button
          data-testid="cancel-button"
          variant="outlined"
          onClick={() => {
            clearBooking();
            navigate('/');
          }}
        >
          Cancel
        </Button>
        <Button
          data-testid="continue-button"
          variant="contained"
          disabled={selectedCount === 0}
          onClick={() => navigate(`/screenings/${screeningId}/summary`)}
        >
          Continue
        </Button>
      </Stack>
    </Box>
  );
}

export default SeatSelection;
