import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useBooking } from '../booking/BookingContext';

export function Confirmation() {
  const navigate = useNavigate();
  const { booking, clearBooking } = useBooking();

  useEffect(() => {
    if (!booking || !booking.paid) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!booking || !booking.paid) return null;

  const handleContinue = () => {
    clearBooking();
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', p: 4, textAlign: 'center' }}>
      <Typography data-testid="confirmation-heading" variant="h4">
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message" sx={{ mt: 2 }}>
        Your tickets will be sent shortly to {booking.customerEmail}
      </Typography>
      <Button data-testid="confirmation-continue-button" variant="contained" sx={{ mt: 3 }} onClick={handleContinue}>
        Continue
      </Button>
    </Box>
  );
}

export default Confirmation;
