import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useBooking } from '../../booking/BookingContext';
import { useBookingGuard } from '../../booking/useBookingGuard';

export function Confirmation() {
  const navigate = useNavigate();
  const { booking, clearBooking } = useBooking();
  const guardPassed = useBookingGuard({ requirePaid: true });

  if (!guardPassed || !booking) {
    return null;
  }

  function handleContinue() {
    clearBooking();
    navigate('/');
  }

  return (
    <div style={{ maxWidth: 500, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      <Typography data-testid="confirmation-heading" variant="h4" gutterBottom>
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message" gutterBottom>
        Your tickets will be sent shortly to {booking.email}
      </Typography>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}
