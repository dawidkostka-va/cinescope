import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { getMovies, getScreening } from '../../api/client';
import type { Movie, Screening } from '../../api/types';
import { useBooking } from '../../booking/BookingContext';
import { createEmptyBooking } from '../../booking/types';
import { showDate } from '../../domain/dates';
import { MAX_SEATS } from '../../domain/seatMap';
import { useToast } from '../../toast/ToastContext';
import { AuditoriumGrid } from './AuditoriumGrid';
import { Legend } from './Legend';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';
import './seat-map.scss';

export function SeatMap() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { booking, bookingRef, setBooking, updateBooking, clearBooking } = useBooking();
  const { showToast } = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setScreening(null);
    setMovie(null);
    setLoadFailed(false);

    const screeningId = Number(id);

    (async () => {
      try {
        const loadedScreening = await getScreening(screeningId);
        const movies = await getMovies();
        if (cancelled) return;

        const loadedMovie = movies.find((candidate) => candidate.id === loadedScreening.movieId) ?? null;
        if (!loadedMovie) {
          setLoadFailed(true);
          return;
        }

        setScreening(loadedScreening);
        setMovie(loadedMovie);

        const current = bookingRef.current;
        const keepsCurrent = current && current.screeningId === screeningId && !current.paid;
        if (!keepsCurrent) {
          setBooking(createEmptyBooking(screeningId));
        }
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // bookingRef is a stable ref; booking resets are keyed only by the route id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (loadFailed) navigate('/', { replace: true });
  }, [loadFailed, navigate]);

  if (!screening || !movie || !booking) {
    return null;
  }

  const occupied = new Set(screening.occupiedSeats);
  const selected = new Set(booking.seats);

  function addSeats(ids: string[]) {
    if (selected.size + ids.length > MAX_SEATS) {
      showToast('Maximum 10 seats per booking');
      return;
    }
    updateBooking((current) => ({ ...current, seats: [...current.seats, ...ids] }));
  }

  function removeSeats(ids: string[]) {
    const idSet = new Set(ids);
    updateBooking((current) => ({
      ...current,
      seats: current.seats.filter((seatId) => !idSet.has(seatId)),
    }));
  }

  function handleToggleSeat(seatId: string) {
    if (selected.has(seatId)) {
      removeSeats([seatId]);
    } else {
      addSeats([seatId]);
    }
  }

  function handleToggleCouch([a, b]: [string, string]) {
    if (selected.has(a) && selected.has(b)) {
      removeSeats([a, b]);
    } else {
      addSeats([a, b]);
    }
  }

  function handleCancel() {
    clearBooking();
    navigate('/');
  }

  function handleContinue() {
    if (booking.seats.length === 0) return;
    navigate(`/screenings/${screening.id}/summary`);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Typography data-testid="seat-map-title" variant="h4" align="center" gutterBottom>
        Choose your seats
      </Typography>
      <Typography data-testid="seat-map-subtitle" variant="subtitle1" align="center" gutterBottom>
        Show Date: {showDate(screening.date, screening.time)}
      </Typography>
      <Typography data-testid="seat-limit-info" align="center" gutterBottom>
        You can reserve up to 10 seats per reservation
      </Typography>

      <div className="auditorium">
        <div data-testid="screen-indicator" className="screen-bar">
          SCREEN
        </div>
        <AuditoriumGrid
          occupied={occupied}
          selected={selected}
          onToggleSeat={handleToggleSeat}
          onToggleCouch={handleToggleCouch}
        />
        <Legend />
        <SelectedSeatsPanel seats={booking.seats} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
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
      </div>
    </div>
  );
}

