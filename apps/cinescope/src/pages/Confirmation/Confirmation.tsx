import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Booking, clearBooking, loadBooking } from '../../booking/bookingStore';
import './confirmation.scss';

export function Confirmation() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const existing = loadBooking();
    if (!existing || !existing.paid) {
      navigate('/', { replace: true });
      return;
    }
    setBooking(existing);
  }, [navigate]);

  if (!booking) return null;

  function handleContinue() {
    clearBooking();
    navigate('/');
  }

  return (
    <div className="confirmation-page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {booking.email}</p>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}
