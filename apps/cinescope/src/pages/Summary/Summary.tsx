import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { getMovie, getScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { loadBooking, saveBooking } from '../../booking/storage';
import { formatPrice, getItemPrice, getItemSeatIds, getSelectionItems, getTotalPrice } from '../../utils/auditorium';

export function Summary() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [seats, setSeats] = useState<string[] | null>(null);

  useEffect(() => {
    const booking = loadBooking();
    if (!booking || booking.paid || booking.screeningId !== screeningId || booking.seats.length === 0) {
      navigate('/', { replace: true });
      return;
    }
    setSeats(booking.seats);
  }, [screeningId, navigate]);

  useEffect(() => {
    if (seats === null) return;
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
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId, seats !== null]);

  if (!screening || !movie || seats === null) {
    return null;
  }

  const items = getSelectionItems(seats);
  const total = getTotalPrice(seats);

  function handleRemove(ids: string[]) {
    const nextSeats = (seats ?? []).filter((seatId) => !ids.includes(seatId));
    const booking = loadBooking();
    if (booking) {
      saveBooking({ ...booking, seats: nextSeats });
    }
    if (nextSeats.length === 0) {
      navigate(`/screenings/${screeningId}/seats`);
    } else {
      setSeats(nextSeats);
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Typography data-testid="summary-title" variant="h5" sx={{ mb: 2 }}>
        Your tickets
      </Typography>
      <Box data-testid="summary-list" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((item) => {
          const seatLabel = item.type === 'seat' ? String(item.column) : `Couch ${item.columnStart}-${item.columnEnd}`;
          const key = item.type === 'seat' ? `seat-${item.row}-${item.column}` : `couch-${item.row}-${item.columnStart}`;
          return (
            <Box
              key={key}
              data-testid="summary-item"
              sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #ddd', pb: 1 }}
            >
              <Typography data-testid="summary-item-title">{movie.title}</Typography>
              <Typography data-testid="summary-item-datetime">{`${screening.date} ${screening.time}`}</Typography>
              <Typography data-testid="summary-item-row">{item.row}</Typography>
              <Typography data-testid="summary-item-seat">{seatLabel}</Typography>
              <Typography data-testid="summary-item-price">{formatPrice(getItemPrice(item))}</Typography>
              <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(getItemSeatIds(item))}>
                Remove
              </Button>
            </Box>
          );
        })}
      </Box>
      <Typography data-testid="summary-total" sx={{ mt: 2 }}>
        {`Total: ${total.toFixed(2)} PLN`}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
