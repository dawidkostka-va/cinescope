import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { useTicketScreen } from '../../booking/useTicketScreen';
import { TicketItem } from '../../booking/ticketItems';
import { formatPrice } from '../../format';
import './summary.scss';

export function Summary() {
  const navigate = useNavigate();
  const { screeningId, booking, updateBooking, screening, movie, items, total, ready } = useTicketScreen();

  if (!ready || !booking || !screening || !movie) return null;

  function handleRemove(item: TicketItem) {
    const remaining = booking.seats.filter((seatId) => !item.seatIds.includes(seatId));
    updateBooking((current) => ({ ...current, seats: remaining }));
    if (remaining.length === 0) {
      navigate(`/screenings/${screeningId}/seats`);
    }
  }

  return (
    <div className="summary-page">
      <h1 data-testid="summary-title">Your tickets</h1>
      <div data-testid="summary-list" className="summary-list">
        {items.map((item) => (
          <div key={item.key} data-testid="summary-item" className="summary-item">
            <div data-testid="summary-item-title">{movie.title}</div>
            <div data-testid="summary-item-datetime">
              {screening.date} {screening.time}
            </div>
            <div data-testid="summary-item-row">{item.row}</div>
            <div data-testid="summary-item-seat">{item.description}</div>
            <div data-testid="summary-item-price">{formatPrice(item.price)}</div>
            <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(item)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <div data-testid="summary-total">Total: {formatPrice(total)}</div>
      <div className="summary-actions">
        <Button data-testid="back-button" variant="outlined" onClick={() => navigate(`/screenings/${screeningId}/seats`)}>
          Back
        </Button>
        <Button data-testid="confirm-button" variant="contained" onClick={() => navigate(`/screenings/${screeningId}/checkout`)}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
