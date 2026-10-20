import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { fetchMovie, fetchScreening } from '../../lib/api';
import { Movie, Screening } from '../../lib/types';
import { useBooking } from '../../lib/booking-context';
import { computeSelectionUnits, formatPrice, unitPrice, unitSeatLabel } from '../../lib/seat-geometry';
import './summary.scss';

export function Summary() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, removeUnit } = useBooking();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [failed, setFailed] = useState(false);

  const bookingValid =
    booking !== null &&
    !booking.paid &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0;

  useEffect(() => {
    if (!bookingValid) return;
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
  }, [screeningId, bookingValid]);

  useEffect(() => {
    if (!bookingValid || failed) {
      navigate('/', { replace: true });
    }
  }, [bookingValid, failed, navigate]);

  const units = useMemo(
    () => (booking ? computeSelectionUnits(booking.seats) : []),
    [booking],
  );

  if (!bookingValid || !screening || !movie) {
    return null;
  }

  const total = units.reduce((sum, unit) => sum + unitPrice(unit), 0);

  const handleRemove = (ids: string[]) => {
    removeUnit(ids);
    if (booking && booking.seats.length - ids.length === 0) {
      navigate(`/screenings/${screeningId}/seats`);
    }
  };

  return (
    <div className="summary-page">
      <h1 data-testid="summary-title">Your tickets</h1>
      <div className="summary-list" data-testid="summary-list">
        {units.map((unit) => (
          <div className="summary-item" data-testid="summary-item" key={unit.ids.join('-')}>
            <div data-testid="summary-item-title">{movie.title}</div>
            <div data-testid="summary-item-datetime">
              {screening.date} {screening.time}
            </div>
            <div data-testid="summary-item-row">{unit.row}</div>
            <div data-testid="summary-item-seat">
              {unit.isCouch ? `Couch ${unitSeatLabel(unit)}` : unitSeatLabel(unit)}
            </div>
            <div data-testid="summary-item-price">{formatPrice(unitPrice(unit))}</div>
            <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(unit.ids)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div data-testid="summary-total">Total: {formatPrice(total)}</div>

      <div className="actions">
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
      </div>
    </div>
  );
}

export default Summary;
