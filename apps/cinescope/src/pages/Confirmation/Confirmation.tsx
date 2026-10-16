import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useBooking } from '../../lib/bookingContext';

export function Confirmation() {
  const navigate = useNavigate();
  const { booking, clear } = useBooking();

  const bookingIsValid = !!booking && booking.paid;

  useEffect(() => {
    if (!bookingIsValid) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bookingIsValid || !booking) {
    return null;
  }

  const handleContinue = () => {
    clear();
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, textAlign: 'center' }}>
      <Typography data-testid="confirmation-heading" variant="h4" sx={{ mb: 2 }}>
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message" sx={{ mb: 3 }}>
        Your tickets will be sent shortly to {booking.email}
      </Typography>
      <Button
        data-testid="confirmation-continue-button"
        variant="contained"
        onClick={handleContinue}
      >
        Continue
      </Button>
    </Box>
  );
}
