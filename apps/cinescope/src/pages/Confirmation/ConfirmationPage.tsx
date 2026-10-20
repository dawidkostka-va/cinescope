import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useBooking } from '../../booking/BookingContext';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { booking, setBooking } = useBooking();

  useEffect(() => {
    if (!booking || !booking.paid) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!booking || !booking.paid) {
    return null;
  }

  function handleContinue() {
    setBooking(null);
    navigate('/');
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', p: 3, textAlign: 'center' }}>
      <Typography data-testid="confirmation-heading" variant="h4">
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message" sx={{ mt: 2 }}>
        {`Your tickets will be sent shortly to ${booking.customerEmail}`}
      </Typography>
      <Button data-testid="confirmation-continue-button" variant="contained" sx={{ mt: 3 }} onClick={handleContinue}>
        Continue
      </Button>
    </Box>
  );
}
