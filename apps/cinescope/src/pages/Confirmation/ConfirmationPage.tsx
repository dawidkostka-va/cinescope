import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { clearBooking, readBooking } from '../../booking/bookingStorage';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const booking = readBooking();
    if (!booking || !booking.paid) {
      navigate('/', { replace: true });
      return;
    }
    setEmail(booking.customerEmail);
  }, [navigate]);

  if (email === null) {
    return null;
  }

  const handleContinue = () => {
    clearBooking();
    navigate('/');
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
      <Typography data-testid="confirmation-heading" variant="h5">
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message">
        Your tickets will be sent shortly to {email}
      </Typography>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={handleContinue}>
        Continue
      </Button>
    </Box>
  );
}
