import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMovie, getScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { useBooking } from '../../booking/BookingContext';
import { formatPrice, seatLabel, toSummaryItems } from '../../lib/seats';

export function Summary() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, removeItem } = useBooking();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);

  const bookingValid =
    !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;

  useEffect(() => {
    if (!bookingValid) {
      navigate('/', { replace: true });
      return;
    }
    let cancelled = false;
    getScreening(screeningId)
      .then(async (loadedScreening) => {
        const loadedMovie = await getMovie(loadedScreening.movieId);
        if (cancelled) return;
        setScreening(loadedScreening);
        setMovie(loadedMovie);
      })
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId, bookingValid]);

  if (!bookingValid || !screening || !movie || !booking) return null;

  const items = toSummaryItems(booking.seats);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const datetime = `${screening.date} ${screening.time}`;

  function onRemove(identifiers: string[]) {
    removeItem(identifiers);
    if (items.length <= 1) navigate(`/screenings/${screeningId}/seats`);
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <Typography data-testid="summary-title" variant="h4">
        Your tickets
      </Typography>

      <Stack data-testid="summary-list" spacing={2} sx={{ my: 2 }}>
        {items.map((item) => (
          <Stack
            key={item.identifiers.join('-')}
            data-testid="summary-item"
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center' }}
          >
            <Typography data-testid="summary-item-title">{movie.title}</Typography>
            <Typography data-testid="summary-item-datetime">{datetime}</Typography>
            <Typography data-testid="summary-item-row">{item.row}</Typography>
            <Typography data-testid="summary-item-seat">{seatLabel(item)}</Typography>
            <Typography data-testid="summary-item-price">{formatPrice(item.price)}</Typography>
            <Button data-testid="summary-item-remove-button" onClick={() => onRemove(item.identifiers)}>
              Remove
            </Button>
          </Stack>
        ))}
      </Stack>

      <Typography data-testid="summary-total" variant="h6">
        Total: {formatPrice(total)}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button data-testid="back-button" variant="outlined" onClick={() => navigate(`/screenings/${screeningId}/seats`)}>
          Back
        </Button>
        <Button data-testid="confirm-button" variant="contained" onClick={() => navigate(`/screenings/${screeningId}/checkout`)}>
          Confirm
        </Button>
      </Stack>
    </div>
  );
}

export default Summary;
