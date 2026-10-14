import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { useToast } from '../../context/ToastContext';
import { getMovie, getScreening } from '../../lib/api';
import { createBooking } from '../../lib/booking';
import { formatShowDate } from '../../lib/dates';
import { MAX_SEATS_PER_BOOKING, toggleCouchSelection, toggleSeatSelection } from '../../lib/seats';
import { Movie, Screening } from '../../lib/types';
import { Auditorium } from './Auditorium';
import { Legend } from './Legend';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';

export function SeatMap() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, setBooking, updateBooking, clearBooking } = useBooking();
  const { showToast } = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    let cancelled = false;
    setScreening(null);
    setMovie(null);
    getScreening(screeningId)
      .then((loadedScreening) =>
        getMovie(loadedScreening.movieId).then((loadedMovie) => {
          if (cancelled) return;
          setScreening(loadedScreening);
          setMovie(loadedMovie);
        }),
      )
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [screeningId, navigate]);

  useEffect(() => {
    if (!screening) return;
    const matches = booking && !booking.paid && booking.screeningId === screening.id;
    if (!matches) {
      setBooking(createBooking(screening.id));
    }
    // Deliberately keyed only on `screening`: this should run once when the screening
    // loads, not on every subsequent booking mutation (which would wipe the selection).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screening]);

  const occupiedSeats = useMemo(() => new Set(screening?.occupiedSeats ?? []), [screening]);
  const selectedSeats = useMemo(
    () => new Set(booking && booking.screeningId === screeningId ? booking.seats : []),
    [booking, screeningId],
  );

  if (!screening || !movie || !booking || booking.screeningId !== screeningId) {
    return null;
  }

  const handleSeatClick = (seatId: string) => {
    const result = toggleSeatSelection(booking.seats, seatId);
    if (result === null) {
      showToast(`Maximum ${MAX_SEATS_PER_BOOKING} seats per booking`);
      return;
    }
    updateBooking((b) => ({ ...b, seats: result }));
  };

  const handleCouchClick = (ids: [string, string]) => {
    const result = toggleCouchSelection(booking.seats, ids);
    if (result === null) {
      showToast(`Maximum ${MAX_SEATS_PER_BOOKING} seats per booking`);
      return;
    }
    updateBooking((b) => ({ ...b, seats: result }));
  };

  const handleCancel = () => {
    clearBooking();
    navigate('/');
  };

  const handleContinue = () => {
    if (booking.seats.length === 0) return;
    navigate(`/screenings/${screening.id}/summary`);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: 3 }}>
      <Typography data-testid="seat-map-title" variant="h4" align="center" sx={{ mb: 1 }}>
        Choose your seats
      </Typography>
      <Typography data-testid="seat-map-subtitle" align="center" sx={{ mb: 2 }}>
        Show Date: {formatShowDate(screening.date, screening.time)}
      </Typography>
      <Typography data-testid="seat-limit-info" align="center" sx={{ mb: 3 }}>
        You can reserve up to {MAX_SEATS_PER_BOOKING} seats per reservation
      </Typography>

      <Auditorium
        occupiedSeats={occupiedSeats}
        selectedSeats={selectedSeats}
        onSeatClick={handleSeatClick}
        onCouchClick={handleCouchClick}
      />

      <Legend />

      <SelectedSeatsPanel selectedIds={booking.seats} />

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
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
      </Box>
    </Box>
  );
}
