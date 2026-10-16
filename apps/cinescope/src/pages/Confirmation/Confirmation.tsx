import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { clearBooking, loadBooking } from '../../booking/storage';

export function Confirmation() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const booking = loadBooking();
    if (!booking || !booking.paid) {
      navigate('/', { replace: true });
      return;
    }
    setEmail(booking.paidEmail ?? '');
  }, [navigate]);

  if (email === null) {
    return null;
  }

  function handleContinue() {
    clearBooking();
    navigate('/');
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 4, textAlign: 'center' }}>
      <Typography data-testid="confirmation-heading" variant="h4" sx={{ mb: 2 }}>
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message" sx={{ mb: 3 }}>
        {`Your tickets will be sent shortly to ${email}`}
      </Typography>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={handleContinue}>
        Continue
      </Button>
    </Box>
  );
}
