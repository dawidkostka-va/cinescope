import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovie, fetchScreening } from '../lib/api';
import { getBookingSnapshot, setBooking, useBooking } from '../lib/bookingStore';
import { buildTickets, formatPrice, Ticket, ticketSeatIds } from '../lib/ticketing';
import { Movie, Screening } from '../lib/types';

interface LoadedData {
  status: 'loading' | 'loaded';
  screening?: Screening;
  movie?: Movie;
}

export function SummaryPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const booking = useBooking();
  const [data, setData] = useState<LoadedData>({ status: 'loading' });

  useEffect(() => {
    const snapshot = getBookingSnapshot();
    if (!snapshot || snapshot.paid || snapshot.screeningId !== screeningId || snapshot.seats.length === 0) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchScreening(screeningId)
      .then((screening) => fetchMovie(screening.movieId).then((movie) => ({ screening, movie })))
      .then(({ screening, movie }) => {
        if (!cancelled) setData({ status: 'loaded', screening, movie });
      })
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [screeningId, navigate]);

  if (!booking || data.status !== 'loaded') {
    return null;
  }

  const screening = data.screening as Screening;
  const movie = data.movie as Movie;
  const currentBooking = booking;
  const tickets = buildTickets(currentBooking.seats);
  const total = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

  function handleRemove(ticket: Ticket) {
    const idsToRemove = new Set(ticketSeatIds(ticket));
    const nextSeats = currentBooking.seats.filter((s) => !idsToRemove.has(s));
    setBooking({ ...currentBooking, seats: nextSeats });
    if (nextSeats.length === 0) {
      navigate(`/screenings/${screeningId}/seats`);
    }
  }

  return (
    <div>
      <h1 data-testid="summary-title">Your tickets</h1>
      <div data-testid="summary-list">
        {tickets.map((ticket, index) => (
          <div data-testid="summary-item" key={index}>
            <span data-testid="summary-item-title">{movie.title}</span>
            <span data-testid="summary-item-datetime">
              {screening.date} {screening.time}
            </span>
            <span data-testid="summary-item-row">{ticket.row}</span>
            <span data-testid="summary-item-seat">
              {ticket.kind === 'couch' ? `Couch ${ticket.columns[0]}-${ticket.columns[1]}` : `${ticket.columns[0]}`}
            </span>
            <span data-testid="summary-item-price">{formatPrice(ticket.price)}</span>
            <Button data-testid="summary-item-remove-button" onClick={() => handleRemove(ticket)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <div data-testid="summary-total">Total: {formatPrice(total)}</div>
      <div>
        <Button data-testid="back-button" onClick={() => navigate(`/screenings/${screeningId}/seats`)}>
          Back
        </Button>
        <Button data-testid="confirm-button" onClick={() => navigate(`/screenings/${screeningId}/checkout`)}>
          Confirm
        </Button>
      </div>
    </div>
  );
}

export default SummaryPage;
