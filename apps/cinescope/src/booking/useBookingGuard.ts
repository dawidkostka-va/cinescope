import { useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from './BookingContext';

interface BookingGuardOptions {
  requireScreeningId?: number;
  requirePaid?: boolean;
  requireSeats?: boolean;
}

/**
 * Checks the booking in sessionStorage once per mount (or when the required
 * screening id changes), not on every booking update — matching the spec's
 * "runs when a route is entered ... not while the customer stays on a screen".
 */
export function useBookingGuard({
  requireScreeningId,
  requirePaid,
  requireSeats,
}: BookingGuardOptions): boolean {
  const { bookingRef } = useBooking();
  const navigate = useNavigate();
  const [passed, setPassed] = useState(false);

  useLayoutEffect(() => {
    const booking = bookingRef.current;
    const ok =
      booking !== null &&
      (requireScreeningId === undefined || booking.screeningId === requireScreeningId) &&
      (requirePaid === undefined || booking.paid === requirePaid) &&
      (!requireSeats || booking.seats.length > 0);

    if (!ok) {
      navigate('/', { replace: true });
    } else {
      setPassed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireScreeningId, requirePaid, requireSeats]);

  return passed;
}
