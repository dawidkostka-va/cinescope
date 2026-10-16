import Button from '@mui/material/Button';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearBooking, getBookingSnapshot, useBooking } from '../lib/bookingStore';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const booking = useBooking();

  useEffect(() => {
    const snapshot = getBookingSnapshot();
    if (!snapshot || !snapshot.paid) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!booking || !booking.paid) {
    return null;
  }

  function handleContinue() {
    clearBooking();
    navigate('/');
  }

  return (
    <div>
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <div data-testid="confirmation-message">Your tickets will be sent shortly to {booking.paidEmail}</div>
      <Button data-testid="confirmation-continue-button" onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}

export default ConfirmationPage;
