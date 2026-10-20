import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { fetchMovie, fetchScreening } from '../../api/client';
import { Movie, Screening } from '../../types';
import { useBooking } from '../../booking/BookingContext';
import { buildSelectionItems, computeTotal, formatPrice } from '../../utils/seats';

export function SummaryPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, setBooking } = useBooking();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    if (!booking || booking.paid || booking.screeningId !== screeningId || booking.seats.length === 0) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!Number.isInteger(screeningId)) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;

    fetchScreening(screeningId)
      .then((loadedScreening) => fetchMovie(loadedScreening.movieId).then((loadedMovie) => ({ loadedScreening, loadedMovie })))
      .then(({ loadedScreening, loadedMovie }) => {
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
  }, [screeningId]);

  if (!booking || booking.screeningId !== screeningId || !screening || !movie) {
    return null;
  }

  const items = buildSelectionItems(booking.seats);
  const total = computeTotal(booking.seats);

  function handleRemove(ids: string[]) {
    if (!booking) return;
    const seats = booking.seats.filter((s) => !ids.includes(s));
    setBooking({ ...booking, seats });
    if (seats.length === 0) {
      navigate(`/screenings/${screeningId}/seats`);
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography data-testid="summary-title" variant="h4">
        Your tickets
      </Typography>

      <Box data-testid="summary-list">
        {items.map((item) => (
          <Box
            key={item.ids.join('-')}
            data-testid="summary-item"
            sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, borderBottom: '1px solid #eee' }}
          >
            <Typography data-testid="summary-item-title">{movie.title}</Typography>
            <Typography data-testid="summary-item-datetime">{`${screening.date} ${screening.time}`}</Typography>
            <Typography data-testid="summary-item-row">{item.row}</Typography>
            <Typography data-testid="summary-item-seat">
              {item.type === 'couch' ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`}
            </Typography>
            <Typography data-testid="summary-item-price">{formatPrice(item.price)}</Typography>
            <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(item.ids)}>
              Remove
            </Button>
          </Box>
        ))}
      </Box>

      <Typography data-testid="summary-total" sx={{ mt: 2 }} variant="h6">
        {`Total: ${formatPrice(total)}`}
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
