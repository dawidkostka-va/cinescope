import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { fetchMovie, fetchScreening } from '../../api/client';
import type { Movie, Screening } from '../../api/types';
import { formatPrice } from '../../domain/pricing';
import { formatUnitSeatLabel, getSortedSelectedUnits, getTotalPrice, unitToSeatIds } from '../../domain/seatSelection';
import { isUsableBookingFor, readBooking, writeBooking, type Booking } from '../../booking/bookingStorage';

export function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const existing = readBooking();
    if (!isUsableBookingFor(existing, screeningId)) {
      navigate('/', { replace: true });
      return;
    }
    setBooking(existing);

    let cancelled = false;
    (async () => {
      try {
        const loadedScreening = await fetchScreening(screeningId);
        const loadedMovie = await fetchMovie(loadedScreening.movieId);
        if (cancelled) {
          return;
        }
        setScreening(loadedScreening);
        setMovie(loadedMovie);
      } catch {
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  if (!screening || !movie || !booking) {
    return null;
  }

  const units = getSortedSelectedUnits(booking.seats);
  const total = getTotalPrice(units);

  const handleRemove = (seatIdsToRemove: string[]) => {
    const nextSeats = booking.seats.filter((seat) => !seatIdsToRemove.includes(seat));
    const next = { ...booking, seats: nextSeats };
    writeBooking(next);
    if (nextSeats.length === 0) {
      navigate(`/screenings/${screeningId}/seats`);
      return;
    }
    setBooking(next);
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography data-testid="summary-title" variant="h5">
        Your tickets
      </Typography>

      <Box data-testid="summary-list" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {units.map((unit, index) => (
          <Box
            key={index}
            data-testid="summary-item"
            sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e0e0e0', p: 1, borderRadius: 1 }}
          >
            <Typography data-testid="summary-item-title">{movie.title}</Typography>
            <Typography data-testid="summary-item-datetime">
              {screening.date} {screening.time}
            </Typography>
            <Typography data-testid="summary-item-row">{unit.row}</Typography>
            <Typography data-testid="summary-item-seat">
              {unit.kind === 'seat' ? formatUnitSeatLabel(unit) : `Couch ${formatUnitSeatLabel(unit)}`}
            </Typography>
            <Typography data-testid="summary-item-price">{formatPrice(unit.price)}</Typography>
            <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(unitToSeatIds(unit))}>
              Remove
            </Button>
          </Box>
        ))}
      </Box>

      <Typography data-testid="summary-total">Total: {formatPrice(total)}</Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button data-testid="back-button" variant="outlined" onClick={() => navigate(`/screenings/${screeningId}/seats`)}>
          Back
        </Button>
        <Button data-testid="confirm-button" variant="contained" onClick={() => navigate(`/screenings/${screeningId}/checkout`)}>
          Confirm
        </Button>
      </Box>
    </Box>
  );
}
