import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { getMovie, getScreening } from '../../lib/api';
import { buildBookingItems, formatPrice } from '../../lib/seats';
import { Movie, Screening } from '../../lib/types';
import { useUnpaidBookingGuard } from '../../routes/useBookingGuard';

export function Summary() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();

  useUnpaidBookingGuard(screeningId);

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    let cancelled = false;
    getScreening(screeningId)
      .then((loadedScreening) =>
        getMovie(loadedScreening.movieId).then((loadedMovie) => {
          if (cancelled) return;
          setScreening(loadedScreening);
          setMovie(loadedMovie);
        }),
      )
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [screeningId, navigate]);

  const items = useMemo(() => buildBookingItems(booking?.seats ?? []), [booking]);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  if (!screening || !movie || !booking) {
    return null;
  }

  const handleRemove = (ids: string[]) => {
    const nextSeats = booking.seats.filter((seatId) => !ids.includes(seatId));
    updateBooking((b) => ({ ...b, seats: nextSeats }));
    if (nextSeats.length === 0) {
      navigate(`/screenings/${screeningId}/seats`);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography data-testid="summary-title" variant="h4" sx={{ mb: 3 }}>
        Your tickets
      </Typography>

      <Box data-testid="summary-list" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => (
          <Box
            key={item.ids.join('-')}
            data-testid="summary-item"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #ccc',
              borderRadius: 1,
              p: 2,
            }}
          >
            <Box>
              <Typography data-testid="summary-item-title">{movie.title}</Typography>
              <Typography data-testid="summary-item-datetime">
                {screening.date} {screening.time}
              </Typography>
              <Typography data-testid="summary-item-row">{item.row}</Typography>
              <Typography data-testid="summary-item-seat">
                {item.kind === 'couch' ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.column}`}
              </Typography>
              <Typography data-testid="summary-item-price">{formatPrice(item.price)}</Typography>
            </Box>
            <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(item.ids)}>
              Remove
            </Button>
          </Box>
        ))}
      </Box>

      <Typography data-testid="summary-total" sx={{ mt: 2 }}>
        Total: {formatPrice(total)}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button data-testid="back-button" variant="outlined" onClick={() => navigate(`/screenings/${screeningId}/seats`)}>
          Back
        </Button>
        <Button
          data-testid="confirm-button"
          variant="contained"
          onClick={() => navigate(`/screenings/${screeningId}/checkout`)}
        >
          Confirm
        </Button>
      </Box>
    </Box>
  );
}
