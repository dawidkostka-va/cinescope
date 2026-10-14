import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

/**
 * Guards routes 3 and 4 (summary, checkout): the booking must be unpaid, belong to this
 * screening and hold at least one seat. Runs once per mount (route entry), not on every
 * booking change, so in-screen updates (e.g. removing the last summary item) are not
 * redirected by this guard.
 */
export function useUnpaidBookingGuard(screeningId: number): void {
  const { booking } = useBooking();
  const navigate = useNavigate();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    const ok = !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;
    if (!ok) {
      navigate('/', { replace: true });
    }
    // Intentionally only re-checks when the screening id changes, not on every booking update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);
}

/** Guards route 5 (confirmation): the booking must be paid. */
export function usePaidBookingGuard(): void {
  const { booking } = useBooking();
  const navigate = useNavigate();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    if (!booking?.paid) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
