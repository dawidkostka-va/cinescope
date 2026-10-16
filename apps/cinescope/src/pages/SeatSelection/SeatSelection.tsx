import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { fetchMovie, fetchScreening } from '../../lib/api';
import { Movie, Screening } from '../../lib/types';
import { formatShowDate } from '../../lib/dates';
import { useBooking } from '../../lib/bookingContext';
import { useToast } from '../../components/Toast/ToastProvider';
import { SeatMap } from '../../components/SeatMap/SeatMap';
import { Legend } from '../../components/SeatMap/Legend';
import { SelectedSeatsPanel } from '../../components/SeatMap/SelectedSeatsPanel';

export function SeatSelection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { booking, ensureBookingForScreening, toggleSeats, clear } = useBooking();
  const { showToast } = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setScreening(null);
    setMovie(null);
    setFailed(false);

    fetchScreening(id ?? '')
      .then((loadedScreening) => {
        if (cancelled) return;
        return fetchMovie(loadedScreening.movieId).then((loadedMovie) => {
          if (cancelled) return;
          setScreening(loadedScreening);
          setMovie(loadedMovie);
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (screening) {
      ensureBookingForScreening(screening.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screening]);

  useEffect(() => {
    if (failed) {
      navigate('/', { replace: true });
    }
  }, [failed, navigate]);

  const occupiedSeats = useMemo(
    () => new Set(screening?.occupiedSeats ?? []),
    [screening],
  );
  const selectedSeats = useMemo(() => new Set(booking?.seats ?? []), [booking]);

  if (!screening || !movie || !booking || booking.screeningId !== screening.id) {
    return null;
  }

  const handleToggle = (seatIds: string[]) => {
    const result = toggleSeats(seatIds);
    if (result === 'blocked') {
      showToast('Maximum 10 seats per booking');
    }
  };

  const handleCancel = () => {
    clear();
    navigate('/');
  };

  const handleContinue = () => {
    if (booking.seats.length === 0) return;
    navigate(`/screenings/${screening.id}/summary`);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: 3 }}>
      <Typography data-testid="seat-map-title" variant="h5">
        Choose your seats
      </Typography>
      <Typography data-testid="seat-map-subtitle" sx={{ mb: 2 }}>
        Show Date: {formatShowDate(screening.date, screening.time)}
      </Typography>
      <Typography data-testid="seat-limit-info" sx={{ textAlign: 'center', mb: 2 }}>
        You can reserve up to 10 seats per reservation
      </Typography>

      <SeatMap
        occupiedSeats={occupiedSeats}
        selectedSeats={selectedSeats}
        onToggle={handleToggle}
      />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Legend />
      </Box>

      <SelectedSeatsPanel selectedSeats={booking.seats} />

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
    </Box>
  );
}
