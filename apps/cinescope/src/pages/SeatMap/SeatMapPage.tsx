import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { fetchScreening } from '../../api/client';
import { Screening } from '../../types';
import { useBooking } from '../../booking/BookingContext';
import { emptyBooking } from '../../booking/types';
import { useToast } from '../../toast/ToastContext';
import { formatShowDate } from '../../utils/date';
import { TOTAL_ROWS } from './seatMapCells';
import { SeatRow } from './SeatRow';
import { Legend } from './Legend';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';

const MAX_SEATS = 10;

export function SeatMapPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, setBooking } = useBooking();
  const showToast = useToast();

  const [status, setStatus] = useState<'loading' | 'loaded'>('loading');
  const [screening, setScreening] = useState<Screening | null>(null);

  useEffect(() => {
    if (!Number.isInteger(screeningId)) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;
    setStatus('loading');

    fetchScreening(screeningId)
      .then((loaded) => {
        if (cancelled) return;
        setScreening(loaded);
        setStatus('loaded');
      })
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  useEffect(() => {
    if (status !== 'loaded') return;
    setBooking((prev) => {
      if (prev && !prev.paid && prev.screeningId === screeningId) return prev;
      return emptyBooking(screeningId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, screeningId]);

  const occupiedSeats = useMemo(() => new Set(screening?.occupiedSeats ?? []), [screening]);
  const selectedSeats = useMemo(() => new Set(booking?.seats ?? []), [booking]);

  if (status !== 'loaded' || !screening || !booking || booking.screeningId !== screeningId) {
    return null;
  }

  function toggleSeat(id: string) {
    if (!booking || occupiedSeats.has(id)) return;
    const isSelected = booking.seats.includes(id);
    if (!isSelected && booking.seats.length + 1 > MAX_SEATS) {
      showToast('Maximum 10 seats per booking');
      return;
    }
    const seats = isSelected ? booking.seats.filter((s) => s !== id) : [...booking.seats, id];
    setBooking({ ...booking, seats });
  }

  function toggleCouch(id1: string, id2: string) {
    if (!booking || occupiedSeats.has(id1) || occupiedSeats.has(id2)) return;
    const isSelected = booking.seats.includes(id1) || booking.seats.includes(id2);
    if (!isSelected && booking.seats.length + 2 > MAX_SEATS) {
      showToast('Maximum 10 seats per booking');
      return;
    }
    const seats = isSelected
      ? booking.seats.filter((s) => s !== id1 && s !== id2)
      : [...booking.seats, id1, id2];
    setBooking({ ...booking, seats });
  }

  function handleCancel() {
    setBooking(null);
    navigate('/');
  }

  function handleContinue() {
    if (!booking || booking.seats.length === 0) return;
    navigate(`/screenings/${screeningId}/summary`);
  }

  const rows = Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: 3 }}>
      <Typography data-testid="seat-map-title" variant="h4" align="center">
        Choose your seats
      </Typography>
      <Typography data-testid="seat-map-subtitle" variant="subtitle1" align="center">
        {`Show Date: ${formatShowDate(screening.date, screening.time)}`}
      </Typography>

      <Box sx={{ width: 'fit-content', mx: 'auto' }}>
        <Typography data-testid="seat-limit-info" align="center" sx={{ my: 2 }}>
          You can reserve up to 10 seats per reservation
        </Typography>

        <Box
          data-testid="screen-indicator"
          sx={{
            mx: 'auto',
            mb: 2,
            py: 1,
            width: '80%',
            textAlign: 'center',
            bgcolor: 'grey.800',
            color: 'common.white',
            borderRadius: 1,
          }}
        >
          SCREEN
        </Box>

        <Box data-testid="seat-map">
          {rows.map((row) => (
            <SeatRow
              key={row}
              row={row}
              occupiedSeats={occupiedSeats}
              selectedSeats={selectedSeats}
              onToggleSeat={toggleSeat}
              onToggleCouch={toggleCouch}
            />
          ))}
        </Box>

        <Legend />

        <SelectedSeatsPanel seats={booking.seats} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
        <Button data-testid="cancel-button" variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          data-testid="continue-button"
          variant="contained"
          disabled={booking.seats.length === 0}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}
