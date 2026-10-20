import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovie, fetchScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { useBooking } from '../../booking/BookingContext';
import { formatShowDate } from '../../domain/dateFormat';
import { useToast } from '../../toast/ToastContext';
import { Legend } from './Legend';
import { SeatMap } from './SeatMap';
import styles from './SeatSelectionPage.module.scss';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';

type LoadState = { status: 'loading' } | { status: 'loaded'; screening: Screening; movie: Movie };

export function SeatSelectionPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, startBookingForScreening, toggleSeatGroup, clearBooking } = useBooking();
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const screening = await fetchScreening(screeningId);
        const movie = await fetchMovie(screening.movieId);
        if (cancelled) return;
        startBookingForScreening(screeningId);
        setState({ status: 'loaded', screening, movie });
      } catch {
        if (!cancelled) navigate('/', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  if (state.status === 'loading' || !booking || booking.screeningId !== screeningId) {
    return null;
  }

  const occupied = new Set(state.screening.occupiedSeats);
  const selected = new Set(booking.seats);

  function handleToggle(ids: string[]): void {
    const result = toggleSeatGroup(ids);
    if (result === 'limit') {
      showToast('Maximum 10 seats per booking');
    }
  }

  function handleCancel(): void {
    clearBooking();
    navigate('/');
  }

  function handleContinue(): void {
    if (selected.size === 0) return;
    navigate(`/screenings/${screeningId}/summary`);
  }

  return (
    <div className={styles.page}>
      <h1 data-testid="seat-map-title">Choose your seats</h1>
      <p data-testid="seat-map-subtitle">Show Date: {formatShowDate(state.screening.date, state.screening.time)}</p>
      <p data-testid="seat-limit-info" className={styles.limitInfo}>
        You can reserve up to 10 seats per reservation
      </p>
      <div data-testid="screen-indicator" className={styles.screen}>
        SCREEN
      </div>
      <SeatMap
        occupied={occupied}
        selected={selected}
        onToggleSeat={(seat) => handleToggle([seat])}
        onToggleCouch={(a, b) => handleToggle([a, b])}
      />
      <Legend />
      <SelectedSeatsPanel selected={booking.seats} />
      <div className={styles.actions}>
        <Button data-testid="cancel-button" variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        <Button data-testid="continue-button" variant="contained" disabled={selected.size === 0} onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
