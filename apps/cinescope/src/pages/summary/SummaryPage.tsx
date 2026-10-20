import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovie, fetchScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { useBooking } from '../../booking/BookingContext';
import { isBookingUsable } from '../../booking/types';
import { BookedItem, buildBookedItems, formatPrice } from '../../domain/seatLayout';
import styles from './SummaryPage.module.scss';

type LoadState = { status: 'loading' } | { status: 'loaded'; screening: Screening; movie: Movie };

export function SummaryPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, removeSeats } = useBooking();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!isBookingUsable(booking, screeningId)) {
      navigate('/', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const screening = await fetchScreening(screeningId);
        const movie = await fetchMovie(screening.movieId);
        if (!cancelled) setState({ status: 'loaded', screening, movie });
      } catch {
        if (!cancelled) navigate('/', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === 'loading' || !booking || !isBookingUsable(booking, screeningId)) {
    return null;
  }

  const items = buildBookedItems(booking.seats);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  function handleRemove(item: BookedItem): void {
    removeSeats(item.ids);
    if (items.length === 1) {
      navigate(`/screenings/${screeningId}/seats`);
    }
  }

  return (
    <div className={styles.page}>
      <h1 data-testid="summary-title">Your tickets</h1>
      <div data-testid="summary-list">
        {items.map((item) => (
          <div key={item.key} data-testid="summary-item" className={styles.item}>
            <div className={styles.itemDetails}>
              <div data-testid="summary-item-title">{state.movie.title}</div>
              <div data-testid="summary-item-datetime">
                {state.screening.date} {state.screening.time}
              </div>
              <div>
                Row <span data-testid="summary-item-row">{item.row}</span>, Seat{' '}
                <span data-testid="summary-item-seat">{item.row === 15 ? `Couch ${item.seatDescription}` : item.seatDescription}</span>
              </div>
            </div>
            <div data-testid="summary-item-price">{formatPrice(item.price)}</div>
            <Button data-testid="summary-item-remove-button" variant="outlined" onClick={() => handleRemove(item)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <div data-testid="summary-total" className={styles.total}>
        Total: {total.toFixed(2)} PLN
      </div>
      <div className={styles.actions}>
        <Button data-testid="back-button" variant="outlined" onClick={() => navigate(`/screenings/${screeningId}/seats`)}>
          Back
        </Button>
        <Button data-testid="confirm-button" variant="contained" onClick={() => navigate(`/screenings/${screeningId}/checkout`)}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
