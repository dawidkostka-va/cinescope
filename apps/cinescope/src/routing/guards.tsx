import { ReactNode, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useBooking } from '../booking/BookingContext';

export function RequireActiveBooking({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const { booking } = useBooking();
  const [allowed] = useState(() => {
    const screeningId = Number(id);
    return !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;
  });
  if (!allowed) return <Navigate to="/" replace />;
  return children;
}

export function RequirePaidBooking({ children }: { children: ReactNode }) {
  const { booking } = useBooking();
  const [allowed] = useState(() => !!booking && booking.paid);
  if (!allowed) return <Navigate to="/" replace />;
  return children;
}
