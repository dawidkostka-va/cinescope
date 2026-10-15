import { Navigate, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useBooking } from '../../booking/BookingContext';
import { useBookingGuard } from '../../booking/useBookingGuard';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { booking, clear } = useBooking();

  const allowed = useBookingGuard(() => !!booking && booking.paid);
  const email = booking?.customerEmail ?? '';

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24, textAlign: 'center' }}>
      <Typography variant="h4" data-testid="confirmation-heading">
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message" sx={{ mt: 2 }}>
        Your tickets will be sent shortly to {email}
      </Typography>
      <Button
        data-testid="confirmation-continue-button"
        variant="contained"
        sx={{ mt: 3 }}
        onClick={() => {
          clear();
          navigate('/');
        }}
      >
        Continue
      </Button>
    </div>
  );
}
