import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMovie, getScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { useBooking } from '../../booking/BookingContext';
import { useToast } from '../../components/Toast/ToastContext';
import { formatShowDate } from '../../lib/dateFormat';
import { ROW_COUNT } from '../../lib/seats';
import Legend from './Legend';
import styles from './SeatMap.module.scss';
import SeatRow from './SeatRow';
import SelectedSeatsPanel from './SelectedSeatsPanel';

export function SeatMap() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, ensureBookingForScreening, toggleSelection, clearBooking } = useBooking();
  const { showToast } = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    let cancelled = false;
    setScreening(null);
    setMovie(null);
    getScreening(screeningId)
      .then(async (loadedScreening) => {
        const loadedMovie = await getMovie(loadedScreening.movieId);
        if (cancelled) return;
        setScreening(loadedScreening);
        setMovie(loadedMovie);
        ensureBookingForScreening(screeningId);
      })
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  if (!screening || !movie) return null;

  const occupied = new Set(screening.occupiedSeats);
  const selectedSeats = booking && booking.screeningId === screeningId ? booking.seats : [];
  const selected = new Set(selectedSeats);

  function onToggle(identifiers: string[]) {
    const result = toggleSelection(identifiers);
    if (result === 'rejected') showToast('Maximum 10 seats per booking');
  }

  function onCancel() {
    clearBooking();
    navigate('/');
  }

  function onContinue() {
    if (selectedSeats.length === 0) return;
    navigate(`/screenings/${screeningId}/summary`);
  }

  const rows = Array.from({ length: ROW_COUNT }, (_, i) => i + 1);

  return (
    <div className={styles.page}>
      <Typography data-testid="seat-map-title" variant="h4">
        Choose your seats
      </Typography>
      <Typography data-testid="seat-map-subtitle" className={styles.subtitle}>
        Show Date: {formatShowDate(screening.date, screening.time)}
      </Typography>
      <Typography data-testid="seat-limit-info" className={styles.limitInfo}>
        You can reserve up to 10 seats per reservation
      </Typography>

      <div data-testid="screen-indicator" className={styles.screen}>
        SCREEN
      </div>

      <div data-testid="seat-map" className={styles.auditorium}>
        {rows.map((row) => (
          <SeatRow key={row} row={row} occupied={occupied} selected={selected} onToggle={onToggle} />
        ))}
      </div>

      <Legend />

      <SelectedSeatsPanel seats={selectedSeats} />

      <div className={styles.actions}>
        <Button data-testid="cancel-button" variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          data-testid="continue-button"
          variant="contained"
          disabled={selectedSeats.length === 0}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

export default SeatMap;
