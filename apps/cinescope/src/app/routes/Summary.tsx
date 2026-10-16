import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { fetchMovie, fetchScreening } from '../api/client';
import { Movie, Screening } from '../api/types';
import { useBooking } from '../booking/BookingContext';
import { deriveSeatItems, formatPrice } from '../utils/seats';

export function Summary() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, removeSeats } = useBooking();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!booking || booking.paid || booking.screeningId !== screeningId || booking.seats.length === 0) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchScreening(screeningId)
      .then((s) =>
        fetchMovie(s.movieId).then((m) => {
          if (cancelled) return;
          setScreening(s);
          setMovie(m);
        }),
      )
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [screeningId]);

  useEffect(() => {
    if (loadFailed) navigate('/', { replace: true });
  }, [loadFailed, navigate]);

  if (!booking || !screening || !movie) return null;

  const items = deriveSeatItems(booking.seats);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  const handleRemove = (ids: string[]) => {
    const isLast = booking.seats.length === ids.length;
    removeSeats(ids);
    if (isLast) {
      navigate(`/screenings/${screeningId}/seats`);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 4 }}>
      <Typography data-testid="summary-title" variant="h4">
        Your tickets
      </Typography>
      <Stack data-testid="summary-list" spacing={2} sx={{ my: 2 }}>
        {items.map((item) => (
          <Stack
            key={item.ids.join('-')}
            data-testid="summary-item"
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center' }}
          >
            <Typography data-testid="summary-item-title">{movie.title}</Typography>
            <Typography data-testid="summary-item-datetime">
              {screening.date} {screening.time}
            </Typography>
            <Typography data-testid="summary-item-row">{item.row}</Typography>
            <Typography data-testid="summary-item-seat">
              {item.kind === 'couch' ? `Couch ${item.seatLabel}` : item.seatLabel}
            </Typography>
            <Typography data-testid="summary-item-price">{formatPrice(item.price)}</Typography>
            <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(item.ids)}>
              Remove
            </Button>
          </Stack>
        ))}
      </Stack>
      <Typography data-testid="summary-total">Total: {formatPrice(total)}</Typography>
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
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
      </Stack>
    </Box>
  );
}

export default Summary;
