import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { fetchMovie, fetchScreening } from '../../api';
import type { Movie, Screening } from '../../types';
import { Booking, loadBooking, saveBooking } from '../../booking';
import { formatPrice, getBookingItems, seatDescription, totalPrice } from '../../seatUtils';

export function SummaryPage() {
  const { screeningId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [guardFailed, setGuardFailed] = useState(false);

  useEffect(() => {
    const existing = loadBooking();
    if (
      !existing ||
      existing.paid ||
      existing.screeningId !== Number(screeningId) ||
      existing.seats.length === 0
    ) {
      setGuardFailed(true);
      navigate('/', { replace: true });
      return;
    }
    setBooking(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  useEffect(() => {
    if (guardFailed) return;
    let cancelled = false;
    async function load() {
      try {
        const loadedScreening = await fetchScreening(screeningId as string);
        if (cancelled) return;
        setScreening(loadedScreening);
        const loadedMovie = await fetchMovie(loadedScreening.movieId);
        if (cancelled) return;
        setMovie(loadedMovie);
      } catch {
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [screeningId, guardFailed, navigate]);

  if (guardFailed || !booking || !screening || !movie) {
    return null;
  }

  const items = getBookingItems(booking.seats);

  function handleRemove(ids: string[]) {
    if (!booking) return;
    const newSeats = booking.seats.filter((id) => !ids.includes(id));
    const updated = { ...booking, seats: newSeats };
    saveBooking(updated);
    if (newSeats.length === 0) {
      navigate(`/screenings/${screeningId}/seats`);
      return;
    }
    setBooking(updated);
  }

  function handleBack() {
    navigate(`/screenings/${screeningId}/seats`);
  }

  function handleConfirm() {
    navigate(`/screenings/${screeningId}/checkout`);
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }}>
      <Typography variant="h4" data-testid="summary-title" gutterBottom>
        Your tickets
      </Typography>

      <List data-testid="summary-list">
        {items.map((item) => (
          <ListItem
            key={item.ids.join('+')}
            data-testid="summary-item"
            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
          >
            <Stack>
              <Typography data-testid="summary-item-title">{movie.title}</Typography>
              <Typography data-testid="summary-item-datetime">
                {screening.date} {screening.time}
              </Typography>
              <Typography data-testid="summary-item-row">{item.row}</Typography>
              <Typography data-testid="summary-item-seat">{seatDescription(item)}</Typography>
              <Typography data-testid="summary-item-price">{formatPrice(item.price)}</Typography>
            </Stack>
            <Button
              data-testid="summary-item-remove-button"
              variant="outlined"
              onClick={() => handleRemove(item.ids)}
            >
              Remove
            </Button>
          </ListItem>
        ))}
      </List>

      <Typography data-testid="summary-total" variant="h6">
        Total: {totalPrice(booking.seats).toFixed(2)} PLN
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button data-testid="back-button" variant="outlined" onClick={handleBack}>
          Back
        </Button>
        <Button data-testid="confirm-button" variant="contained" onClick={handleConfirm}>
          Confirm
        </Button>
      </Stack>
    </Box>
  );
}
