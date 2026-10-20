import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { fetchMovie, fetchScreening } from '../../api/client';
import type { Movie, Screening } from '../../api/types';
import { formatShowDate } from '../../domain/dateUtils';
import { ROW_COUNT } from '../../domain/seatLayout';
import { clearBooking, createEmptyBooking, readBooking, writeBooking, type Booking } from '../../booking/bookingStorage';
import { useToast } from '../../components/ToastProvider';
import { SeatRow } from './SeatRow';
import { Legend } from './Legend';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';
import './SeatMap.scss';

const MAX_SEATS = 10;

export function SeatMapPage() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const showToast = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;
    setScreening(null);
    setMovie(null);

    (async () => {
      try {
        const loadedScreening = await fetchScreening(screeningId);
        const loadedMovie = await fetchMovie(loadedScreening.movieId);
        if (cancelled) {
          return;
        }
        setScreening(loadedScreening);
        setMovie(loadedMovie);

        const existing = readBooking();
        const next =
          existing && existing.screeningId === screeningId && !existing.paid
            ? existing
            : createEmptyBooking(screeningId);
        writeBooking(next);
        setBooking(next);
      } catch {
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  if (!screening || !movie || !booking) {
    return null;
  }

  const occupied = new Set(screening.occupiedSeats);
  const selected = new Set(booking.seats);

  const handleToggle = (ids: string[]) => {
    setBooking((prev) => {
      if (!prev) {
        return prev;
      }
      const currentlySelected = new Set(prev.seats);
      const alreadySelected = ids.every((id) => currentlySelected.has(id));
      let nextSeats: string[];
      if (alreadySelected) {
        nextSeats = prev.seats.filter((seat) => !ids.includes(seat));
      } else {
        if (prev.seats.length + ids.length > MAX_SEATS) {
          showToast('Maximum 10 seats per booking');
          return prev;
        }
        nextSeats = [...prev.seats, ...ids];
      }
      const next = { ...prev, seats: nextSeats };
      writeBooking(next);
      return next;
    });
  };

  const handleCancel = () => {
    clearBooking();
    navigate('/');
  };

  const handleContinue = () => {
    if (booking.seats.length === 0) {
      return;
    }
    navigate(`/screenings/${screeningId}/summary`);
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      <Typography data-testid="seat-map-title" variant="h5">
        Choose your seats
      </Typography>
      <Typography data-testid="seat-map-subtitle">
        Show Date: {formatShowDate(screening.date, screening.time)}
      </Typography>
      <Typography data-testid="seat-limit-info" sx={{ textAlign: 'center' }}>
        You can reserve up to 10 seats per reservation
      </Typography>

      <div className="screen-indicator" data-testid="screen-indicator">
        SCREEN
      </div>

      <div className="seat-map" data-testid="seat-map">
        {Array.from({ length: ROW_COUNT }, (_, i) => i + 1).map((row) => (
          <SeatRow key={row} row={row} selected={selected} occupied={occupied} onToggle={handleToggle} />
        ))}
      </div>

      <Legend />

      <SelectedSeatsPanel seats={booking.seats} />

      <Box sx={{ display: 'flex', gap: 2 }}>
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
