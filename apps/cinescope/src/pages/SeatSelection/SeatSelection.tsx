import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { fetchMovie, fetchScreening } from '../../api/client';
import type { Movie, Screening } from '../../api/types';
import { formatShowDate } from '../../format';
import { MAX_SEATS_PER_BOOKING } from '../../seats/geometry';
import { clearBooking, createBooking, loadBooking, saveBooking } from '../../booking/bookingStore';
import { useToast } from '../../toast/ToastContext';
import { SeatMap } from './SeatMap';
import { Legend } from './Legend';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';
import './seat-selection.scss';

export function SeatSelection() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const showToast = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
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
  }, [screeningId]);

  useEffect(() => {
    if (!screening) return;
    const existing = loadBooking();
    if (existing && !existing.paid && existing.screeningId === screening.id) {
      setSelectedSeats(new Set(existing.seats));
    } else {
      createBooking(screening.id);
      setSelectedSeats(new Set());
    }
  }, [screening]);

  useEffect(() => {
    if (failed) navigate('/', { replace: true });
  }, [failed, navigate]);

  if (!screening || !movie) return null;

  const occupiedSeats = new Set(screening.occupiedSeats);

  function handleToggle(ids: string[], isOccupied: boolean) {
    if (isOccupied) return;
    setSelectedSeats((prev) => {
      const isSelected = ids.every((seat) => prev.has(seat));
      const next = new Set(prev);
      if (isSelected) {
        ids.forEach((seat) => next.delete(seat));
      } else {
        if (prev.size + ids.length > MAX_SEATS_PER_BOOKING) {
          showToast('Maximum 10 seats per booking');
          return prev;
        }
        ids.forEach((seat) => next.add(seat));
      }
      const booking = loadBooking();
      if (booking) saveBooking({ ...booking, seats: [...next] });
      return next;
    });
  }

  function handleCancel() {
    clearBooking();
    navigate('/');
  }

  function handleContinue() {
    if (selectedSeats.size === 0) return;
    navigate(`/screenings/${screeningId}/summary`);
  }

  return (
    <div className="seat-selection-page">
      <h1 data-testid="seat-map-title">Choose your seats</h1>
      <h2 data-testid="seat-map-subtitle">Show Date: {formatShowDate(screening.date, screening.time)}</h2>
      <div className="seat-limit-info" data-testid="seat-limit-info">
        You can reserve up to 10 seats per reservation
      </div>
      <div className="screen-indicator" data-testid="screen-indicator">
        SCREEN
      </div>
      <SeatMap occupiedSeats={occupiedSeats} selectedSeats={selectedSeats} onToggle={handleToggle} />
      <Legend />
      <SelectedSeatsPanel selectedSeats={selectedSeats} />
      <div className="seat-selection-actions">
        <Button data-testid="cancel-button" variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          data-testid="continue-button"
          variant="contained"
          disabled={selectedSeats.size === 0}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
