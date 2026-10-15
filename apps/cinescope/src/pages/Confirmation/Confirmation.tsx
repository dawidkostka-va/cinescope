import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../booking/BookingContext';

export function Confirmation() {
  const navigate = useNavigate();
  const { booking, clearBooking } = useBooking();

  const valid = !!booking && booking.paid;

  useEffect(() => {
    if (!valid) navigate('/', { replace: true });
  }, [valid, navigate]);

  if (!valid || !booking) return null;

  function onContinue() {
    clearBooking();
    navigate('/');
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
      <Typography data-testid="confirmation-heading" variant="h4">
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message" sx={{ my: 2 }}>
        Your tickets will be sent shortly to {booking.customerEmail}
      </Typography>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}

export default Confirmation;
