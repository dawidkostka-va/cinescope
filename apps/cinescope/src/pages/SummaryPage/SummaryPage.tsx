import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovie, fetchScreening } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { useBooking } from '../../booking/BookingContext';
import { formatPrice, priceForItem } from '../../utils/pricing';
import { groupSeatIds, seatIdsForItem, SelectionItem } from '../../utils/seats';
import './SummaryPage.scss';

export function SummaryPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, setSeats } = useBooking();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchScreening(screeningId)
      .then(async (scr) => {
        const mov = await fetchMovie(scr.movieId);
        if (cancelled) return;
        setScreening(scr);
        setMovie(mov);
      })
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  if (!screening || !movie || !booking) return null;

  const items = groupSeatIds(booking.seats);
  const total = items.reduce((sum, item) => sum + priceForItem(item), 0);

  function handleRemove(item: SelectionItem) {
    const idsToRemove = new Set(seatIdsForItem(item));
    const next = booking.seats.filter((seatId) => !idsToRemove.has(seatId));
    setSeats(next);
    if (next.length === 0) navigate(`/screenings/${screeningId}/seats`);
  }

  return (
    <div className="summary-page">
      <h1 data-testid="summary-title">Your tickets</h1>
      <div className="summary-list" data-testid="summary-list">
        {items.map((item) => (
          <div key={seatIdsForItem(item).join('-')} className="summary-item" data-testid="summary-item">
            <span data-testid="summary-item-title">{movie.title}</span>
            <span data-testid="summary-item-datetime">
              {screening.date} {screening.time}
            </span>
            <span data-testid="summary-item-row">{item.row}</span>
            <span data-testid="summary-item-seat">
              {item.kind === 'seat' ? item.column : `Couch ${item.columnStart}-${item.columnEnd}`}
            </span>
            <span data-testid="summary-item-price">{formatPrice(priceForItem(item))}</span>
            <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(item)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <div data-testid="summary-total" className="summary-total">
        Total: {total.toFixed(2)} PLN
      </div>
      <div className="summary-page__actions">
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
      </div>
    </div>
  );
}

export default SummaryPage;
