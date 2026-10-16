import Button from '@mui/material/Button';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovie, fetchScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { useBooking } from '../../booking/BookingContext';
import { useToast } from '../../toast/ToastContext';
import { formatShowDate } from '../../utils/date';
import { buildAuditorium } from '../../utils/seats';
import Legend from './Legend';
import SeatMap from './SeatMap';
import SelectedSeatsPanel from './SelectedSeatsPanel';
import './SeatSelectionPage.scss';

const MAX_SEATS = 10;

export function SeatSelectionPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, startBooking, setSeats, clear } = useBooking();
  const { showToast } = useToast();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);

  const auditorium = useMemo(() => buildAuditorium(), []);

  useEffect(() => {
    if (!Number.isFinite(screeningId)) {
      navigate('/', { replace: true });
      return;
    }
    let cancelled = false;
    fetchScreening(screeningId)
      .then(async (scr) => {
        const mov = await fetchMovie(scr.movieId);
        if (cancelled) return;
        setScreening(scr);
        setMovie(mov);
        startBooking(screeningId);
      })
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  if (!screening || !movie) return null;

  const selectedSeats = booking && booking.screeningId === screeningId ? booking.seats : [];
  const occupied = new Set(screening.occupiedSeats);
  const selected = new Set(selectedSeats);

  function handleToggle(ids: string[]) {
    const isSelected = ids.every((seatIdValue) => selected.has(seatIdValue));
    if (isSelected) {
      setSeats(selectedSeats.filter((seatIdValue) => !ids.includes(seatIdValue)));
      return;
    }
    if (selectedSeats.length + ids.length > MAX_SEATS) {
      showToast('Maximum 10 seats per booking');
      return;
    }
    setSeats([...selectedSeats, ...ids]);
  }

  function handleCancel() {
    clear();
    navigate('/');
  }

  function handleContinue() {
    if (selectedSeats.length === 0) return;
    navigate(`/screenings/${screeningId}/summary`);
  }

  return (
    <div className="seat-selection-page">
      <h1 data-testid="seat-map-title">Choose your seats</h1>
      <p data-testid="seat-map-subtitle">
        Show Date: {formatShowDate(screening.date, screening.time)}
      </p>
      <p data-testid="seat-limit-info">You can reserve up to 10 seats per reservation</p>
      <div className="screen-indicator" data-testid="screen-indicator">
        SCREEN
      </div>
      <SeatMap rows={auditorium} selected={selected} occupied={occupied} onToggle={handleToggle} />
      <Legend />
      <SelectedSeatsPanel seatIds={selectedSeats} />
      <div className="seat-selection-page__actions">
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
      </div>
    </div>
  );
}

export default SeatSelectionPage;
