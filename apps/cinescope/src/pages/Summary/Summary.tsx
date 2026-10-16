import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { fetchMovie, fetchScreening } from '../../lib/api';
import { Movie, Screening } from '../../lib/types';
import { useBooking } from '../../lib/bookingContext';
import { formatPrice, toSelectionUnits } from '../../lib/seats';

export function Summary() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, removeSeats } = useBooking();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [failed, setFailed] = useState(false);

  const bookingIsValid =
    !!booking &&
    !booking.paid &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0;

  useEffect(() => {
    if (!bookingIsValid) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bookingIsValid) return;
    let cancelled = false;
    fetchScreening(screeningId)
      .then((loadedScreening) =>
        fetchMovie(loadedScreening.movieId).then((loadedMovie) => {
          if (cancelled) return;
          setScreening(loadedScreening);
          setMovie(loadedMovie);
        }),
      )
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  useEffect(() => {
    if (failed) {
      navigate('/', { replace: true });
    }
  }, [failed, navigate]);

  if (!bookingIsValid || !booking || !screening || !movie) {
    return null;
  }

  const units = toSelectionUnits(booking.seats);
  const total = units.reduce((sum, unit) => sum + unit.price, 0);

  const handleRemove = (seatIds: string[]) => {
    removeSeats(seatIds);
    if (booking.seats.length - seatIds.length <= 0) {
      navigate(`/screenings/${screening.id}/seats`);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography data-testid="summary-title" variant="h5" sx={{ mb: 2 }}>
        Your tickets
      </Typography>

      <List data-testid="summary-list">
        {units.map((unit) => {
          const seatDescription =
            unit.endColumn !== undefined
              ? `Couch ${unit.startColumn}-${unit.endColumn}`
              : `${unit.startColumn}`;
          return (
            <ListItem
              key={`${unit.row}-${unit.startColumn}`}
              data-testid="summary-item"
              sx={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <Box>
                <Typography data-testid="summary-item-title">{movie.title}</Typography>
                <Typography data-testid="summary-item-datetime">
                  {screening.date} {screening.time}
                </Typography>
                <Typography data-testid="summary-item-row">{unit.row}</Typography>
                <Typography data-testid="summary-item-seat">{seatDescription}</Typography>
                <Typography data-testid="summary-item-price">
                  {formatPrice(unit.price)}
                </Typography>
              </Box>
              <Button
                data-testid="summary-item-remove-button"
                onClick={() => handleRemove(unit.seatIds)}
              >
                Remove
              </Button>
            </ListItem>
          );
        })}
      </List>

      <Typography data-testid="summary-total" variant="h6" sx={{ my: 2 }}>
        Total: {total.toFixed(2)} PLN
      </Typography>

      <Stack direction="row" spacing={2}>
        <Button
          data-testid="back-button"
          variant="outlined"
          onClick={() => navigate(`/screenings/${screening.id}/seats`)}
        >
          Back
        </Button>
        <Button
          data-testid="confirm-button"
          variant="contained"
          onClick={() => navigate(`/screenings/${screening.id}/checkout`)}
        >
          Confirm
        </Button>
      </Stack>
    </Box>
  );
}
