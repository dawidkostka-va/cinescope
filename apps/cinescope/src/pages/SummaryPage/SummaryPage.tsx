import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { fetchMovie, fetchScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { useBooking } from '../../booking/BookingContext';
import { useBookingGuard } from '../../booking/useBookingGuard';
import { formatShowDate } from '../../utils/date';
import {
  formatPrice,
  unitCouchLabel,
  unitIds,
  unitPrice,
  unitSeatDescription,
  unitsFromSeats,
} from '../../seating/units';
import styles from './SummaryPage.module.scss';

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; screening: Screening; movie: Movie };

export function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, removeUnit } = useBooking();

  const allowed = useBookingGuard(
    () => !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0,
  );

  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
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

  const units = useMemo(() => unitsFromSeats(booking?.seats ?? []), [booking]);
  const total = useMemo(() => units.reduce((sum, unit) => sum + unitPrice(unit), 0), [units]);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  if (state.status !== 'loaded' || !booking) {
    return null;
  }

  const { screening, movie } = state;

  const handleRemove = (ids: string[]) => {
    const remaining = booking.seats.filter((seat) => !ids.includes(seat));
    removeUnit(ids);
    if (remaining.length === 0) {
      navigate(`/screenings/${screeningId}/seats`);
    }
  };

  return (
    <div className={styles.page}>
      <Typography variant="h4" data-testid="summary-title">
        Your tickets
      </Typography>

      <div data-testid="summary-list">
        {units.map((unit) => (
          <div key={unit.type === 'seat' ? unit.id : unit.ids.join('+')} data-testid="summary-item" className={styles.item}>
            <span data-testid="summary-item-title" className={styles.field}>
              {movie.title}
            </span>
            <span data-testid="summary-item-datetime" className={styles.field}>
              {formatShowDate(screening.date, screening.time)}
            </span>
            <span data-testid="summary-item-row" className={styles.field}>
              {unit.row}
            </span>
            <span data-testid="summary-item-seat" className={styles.field}>
              {unit.type === 'seat' ? unitSeatDescription(unit) : unitCouchLabel(unit)}
            </span>
            <span data-testid="summary-item-price" className={styles.field}>
              {formatPrice(unitPrice(unit))}
            </span>
            <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(unitIds(unit))}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div data-testid="summary-total" className={styles.total}>
        Total: {formatPrice(total)}
      </div>

      <div className={styles.actions}>
        <Button
          data-testid="back-button"
          variant="outlined"
          onClick={() => navigate(`/screenings/${screeningId}/seats`)}
        >
          Back
        </Button>
        <Button
          data-testid="confirm-button"
          variant="contained"
          onClick={() => navigate(`/screenings/${screeningId}/checkout`)}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
