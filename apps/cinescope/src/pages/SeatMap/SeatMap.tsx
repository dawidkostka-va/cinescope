import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { getMovie, getScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { clearBooking, loadBooking, saveBooking } from '../../booking/storage';
import { createBooking } from '../../booking/types';
import { MAX_SEATS_PER_BOOKING } from '../../utils/auditorium';
import { formatShowDate } from '../../utils/date';
import { useToast } from '../../components/Toast/ToastProvider';
import { Auditorium } from './Auditorium';
import { Legend } from './Legend';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';

export function SeatMap() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const loadedScreening = await getScreening(screeningId);
        const loadedMovie = await getMovie(loadedScreening.movieId);
        if (cancelled) return;

        setScreening(loadedScreening);
        setMovie(loadedMovie);

        const existing = loadBooking();
        if (existing && !existing.paid && existing.screeningId === screeningId) {
          setSelectedSeats(existing.seats);
        } else {
          saveBooking(createBooking(screeningId));
          setSelectedSeats([]);
        }
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
  }, [screeningId, navigate]);

  function persistSeats(seats: string[]) {
    const current = loadBooking();
    const base = current && current.screeningId === screeningId ? current : createBooking(screeningId);
    saveBooking({ ...base, seats });
  }

  function handleToggle(ids: string[]) {
    setSelectedSeats((prev) => {
      const isSelected = ids.every((id) => prev.includes(id));
      let next: string[];
      if (isSelected) {
        next = prev.filter((seatIdValue) => !ids.includes(seatIdValue));
      } else {
        if (prev.length + ids.length > MAX_SEATS_PER_BOOKING) {
          showToast('Maximum 10 seats per booking');
          return prev;
        }
        next = [...prev, ...ids];
      }
      persistSeats(next);
      return next;
    });
  }

  function handleCancel() {
    clearBooking();
    navigate('/');
  }

  function handleContinue() {
    if (selectedSeats.length === 0) return;
    navigate(`/screenings/${screeningId}/summary`);
  }

  const subtitle = useMemo(
    () => (screening ? `Show Date: ${formatShowDate(screening.date, screening.time)}` : ''),
    [screening],
  );

  if (!screening || !movie) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: 4 }}>
      <Typography data-testid="seat-map-title" variant="h5" sx={{ textAlign: 'center' }}>
        Choose your seats
      </Typography>
      <Typography data-testid="seat-map-subtitle" sx={{ textAlign: 'center', mb: 2 }}>
        {subtitle}
      </Typography>
      <Typography data-testid="seat-limit-info" sx={{ textAlign: 'center', mb: 2 }}>
        You can reserve up to 10 seats per reservation
      </Typography>
      <Box
        data-testid="screen-indicator"
        sx={{
          textAlign: 'center',
          mx: 'auto',
          mb: 2,
          width: '80%',
          py: 1,
          backgroundColor: '#ccc',
          borderRadius: '4px',
          letterSpacing: 4,
        }}
      >
        SCREEN
      </Box>
      <Auditorium occupiedSeats={screening.occupiedSeats} selectedSeats={selectedSeats} onToggle={handleToggle} />
      <Legend />
      <SelectedSeatsPanel seats={selectedSeats} />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
        <Button data-testid="cancel-button" variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          data-testid="continue-button"
          variant="contained"
          disabled={selectedSeats.length === 0}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}
