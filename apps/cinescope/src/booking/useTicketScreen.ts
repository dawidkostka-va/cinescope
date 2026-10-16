import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovie, fetchScreening } from '../api/client';
import type { Movie, Screening } from '../api/types';
import { Booking, isUsableUnpaidBooking, loadBooking, saveBooking } from './bookingStore';
import { TicketItem, computeTicketItems, totalPrice } from './ticketItems';

export interface TicketScreen {
  screeningId: number;
  booking: Booking | null;
  updateBooking: (updater: (current: Booking) => Booking) => void;
  screening: Screening | null;
  movie: Movie | null;
  items: TicketItem[];
  total: number;
  ready: boolean;
}

/** Shared guard + data loading for the summary and checkout screens (section 3.1). */
export function useTicketScreen(): TicketScreen {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [screening, setScreening] = useState<Screening | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    const existing = loadBooking();
    if (!isUsableUnpaidBooking(existing, screeningId)) {
      navigate('/', { replace: true });
      return;
    }
    setBooking(existing);

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
        if (!cancelled) navigate('/', { replace: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  function updateBooking(updater: (current: Booking) => Booking) {
    setBooking((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveBooking(next);
      return next;
    });
  }

  const items = booking ? computeTicketItems(booking.seats) : [];
  const total = totalPrice(items);

  return {
    screeningId,
    booking,
    updateBooking,
    screening,
    movie,
    items,
    total,
    ready: !!booking && !!screening && !!movie,
  };
}
