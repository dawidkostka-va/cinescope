import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { getMovies, getScreening } from '../../api/client';
import type { Movie, Screening } from '../../api/types';
import { useBooking } from '../../booking/BookingContext';
import { useBookingGuard } from '../../booking/useBookingGuard';
import { buildBookingItems, totalPrice } from '../../domain/bookingItems';
import { formatPrice } from '../../domain/seatMap';

export function Summary() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const guardPassed = useBookingGuard({
    requireScreeningId: screeningId,
    requirePaid: false,
    requireSeats: true,
  });

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!guardPassed) return;
    let cancelled = false;

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
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [guardPassed, screeningId]);

  useEffect(() => {
    if (loadFailed) navigate('/', { replace: true });
  }, [loadFailed, navigate]);

  if (!guardPassed || !screening || !movie || !booking) {
    return null;
  }

  const items = buildBookingItems(booking.seats);
  const total = totalPrice(booking.seats);

  function handleRemove(seatIds: string[]) {
    const idSet = new Set(seatIds);
    const remaining = booking.seats.length - seatIds.length;
    updateBooking((current) => ({
      ...current,
      seats: current.seats.filter((seatId) => !idSet.has(seatId)),
    }));

    if (remaining <= 0) {
      navigate(`/screenings/${screeningId}/seats`);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <Typography data-testid="summary-title" variant="h4" align="center" gutterBottom>
        Your tickets
      </Typography>

      <div data-testid="summary-list">
        {items.map((item) => (
          <div
            key={item.key}
            data-testid="summary-item"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ddd' }}
          >
            <div>
              <div data-testid="summary-item-title">{movie.title}</div>
              <div data-testid="summary-item-datetime">
                {screening.date} {screening.time}
              </div>
              <div>
                Row <span data-testid="summary-item-row">{item.row}</span>, Seat{' '}
                <span data-testid="summary-item-seat">{item.seatLabel}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span data-testid="summary-item-price">{formatPrice(item.price)}</span>
              <Button
                data-testid="summary-item-remove-button"
                size="small"
                variant="outlined"
                onClick={() => handleRemove(item.seatIds)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Typography data-testid="summary-total" variant="h6" align="right" style={{ marginTop: 16 }}>
        Total: {formatPrice(total)}
      </Typography>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
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
