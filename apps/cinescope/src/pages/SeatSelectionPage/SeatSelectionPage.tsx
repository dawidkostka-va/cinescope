import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { fetchMovie, fetchScreening } from '../../api';
import type { Movie, Screening } from '../../types';
import { Booking, emptyBooking, loadBooking, saveBooking, clearBooking } from '../../booking';
import { formatShowDate } from '../../dateUtils';
import { MAX_SEATS, seatId } from '../../seatUtils';
import { useToast } from '../../toast/ToastProvider';
import { AuditoriumMap, ScreenIndicator } from './AuditoriumMap';
import { Legend } from './Legend';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';

export function SeatSelectionPage() {
  const { screeningId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const loadedScreening = await fetchScreening(screeningId as string);
        if (cancelled) return;
        setScreening(loadedScreening);
        const loadedMovie = await fetchMovie(loadedScreening.movieId);
        if (cancelled) return;
        setMovie(loadedMovie);
      } catch {
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [screeningId, navigate]);

  useEffect(() => {
    if (!screening) return;
    const existing = loadBooking();
    if (existing && !existing.paid && existing.screeningId === screening.id) {
      setBooking(existing);
    } else {
      const fresh = emptyBooking(screening.id);
      saveBooking(fresh);
      setBooking(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screening?.id]);

  const occupiedSeats = useMemo(() => new Set(screening?.occupiedSeats ?? []), [screening]);
  const selectedSeats = useMemo(() => new Set(booking?.seats ?? []), [booking]);

  function updateSeats(newSeats: string[]) {
    if (!booking) return;
    const updated = { ...booking, seats: newSeats };
    setBooking(updated);
    saveBooking(updated);
  }

  function handleToggleSeat(row: number, column: number) {
    if (!booking) return;
    const id = seatId(row, column);
    if (selectedSeats.has(id)) {
      updateSeats(booking.seats.filter((s) => s !== id));
      return;
    }
    if (booking.seats.length + 1 > MAX_SEATS) {
      showToast('Maximum 10 seats per booking');
      return;
    }
    updateSeats([...booking.seats, id]);
  }

  function handleToggleCouch(row: number, columnStart: number, columnEnd: number) {
    if (!booking) return;
    const idA = seatId(row, columnStart);
    const idB = seatId(row, columnEnd);
    if (selectedSeats.has(idA) && selectedSeats.has(idB)) {
      updateSeats(booking.seats.filter((s) => s !== idA && s !== idB));
      return;
    }
    if (booking.seats.length + 2 > MAX_SEATS) {
      showToast('Maximum 10 seats per booking');
      return;
    }
    updateSeats([...booking.seats, idA, idB]);
  }

  function handleCancel() {
    clearBooking();
    navigate('/');
  }

  function handleContinue() {
    if (!booking || booking.seats.length === 0) return;
    navigate(`/screenings/${screeningId}/summary`);
  }

  if (!screening || !movie || !booking) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="h4" data-testid="seat-map-title" sx={{ alignSelf: 'flex-start' }}>
          Choose your seats
        </Typography>
        <Typography data-testid="seat-map-subtitle" sx={{ alignSelf: 'flex-start' }}>
          Show Date: {formatShowDate(screening.date, screening.time)}
        </Typography>
        <Typography data-testid="seat-limit-info" align="center">
          You can reserve up to 10 seats per reservation
        </Typography>

        <ScreenIndicator />
        <AuditoriumMap
          occupiedSeats={occupiedSeats}
          selectedSeats={selectedSeats}
          onToggleSeat={handleToggleSeat}
          onToggleCouch={handleToggleCouch}
        />

        <Legend />

        <SelectedSeatsPanel seatIds={booking.seats} />

        <Stack direction="row" spacing={2}>
          <Button data-testid="cancel-button" variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            data-testid="continue-button"
            variant="contained"
            disabled={booking.seats.length === 0}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
