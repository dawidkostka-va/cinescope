import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Booking, clearBooking, loadBooking } from '../../booking';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [guardFailed, setGuardFailed] = useState(false);

  useEffect(() => {
    const existing = loadBooking();
    if (!existing || !existing.paid) {
      setGuardFailed(true);
      navigate('/', { replace: true });
      return;
    }
    setBooking(existing);
  }, [navigate]);

  if (guardFailed || !booking) {
    return null;
  }

  function handleContinue() {
    clearBooking();
    navigate('/');
  }

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', p: 3, textAlign: 'center' }}>
      <Typography variant="h4" data-testid="confirmation-heading" gutterBottom>
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message" gutterBottom>
        Your tickets will be sent shortly to {booking.customerEmail}
      </Typography>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={handleContinue}>
        Continue
      </Button>
    </Box>
  );
}
