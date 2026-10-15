import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { fetchMovie, fetchScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { formatShowDate } from '../../utils/date';
import { useBooking } from '../../booking/BookingContext';
import { AuditoriumMap } from '../../components/AuditoriumMap/AuditoriumMap';
import { Legend } from '../../components/Legend/Legend';
import { SelectedSeatsPanel } from '../../components/SelectedSeatsPanel/SelectedSeatsPanel';
import styles from './SeatSelectionPage.module.scss';

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; screening: Screening; movie: Movie };

export function SeatSelectionPage() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, initForScreening, toggleUnit, clear } = useBooking();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const initedRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      try {
        const screening = await fetchScreening(screeningId);
        const movie = await fetchMovie(screening.movieId);
        if (!cancelled) {
          setState({ status: 'loaded', screening, movie });
        }
      } catch {
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [screeningId, navigate]);

  useEffect(() => {
    if (state.status === 'loaded' && initedRef.current !== screeningId) {
      initedRef.current = screeningId;
      initForScreening(screeningId);
    }
  }, [state, screeningId, initForScreening]);

  if (state.status !== 'loaded' || !booking || booking.screeningId !== screeningId) {
    return null;
  }

  const { screening } = state;

  return (
    <div className={styles.page}>
      <Typography variant="h4" data-testid="seat-map-title">
        Choose your seats
      </Typography>
      <Typography data-testid="seat-map-subtitle">
        Show Date: {formatShowDate(screening.date, screening.time)}
      </Typography>
      <Typography data-testid="seat-limit-info" className={styles.limitInfo}>
        You can reserve up to 10 seats per reservation
      </Typography>

      <AuditoriumMap
        occupiedSeats={screening.occupiedSeats}
        selectedSeats={booking.seats}
        onToggle={toggleUnit}
      />

      <Legend />

      <SelectedSeatsPanel seats={booking.seats} />

      <div className={styles.actions}>
        <Button
          data-testid="cancel-button"
          variant="outlined"
          onClick={() => {
            clear();
            navigate('/');
          }}
        >
          Cancel
        </Button>
        <Button
          data-testid="continue-button"
          variant="contained"
          disabled={booking.seats.length === 0}
          onClick={() => navigate(`/screenings/${screeningId}/summary`)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
