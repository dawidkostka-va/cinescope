import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { usePaidBookingGuard } from '../../routes/useBookingGuard';

export function Confirmation() {
  const { booking, clearBooking } = useBooking();
  const navigate = useNavigate();

  usePaidBookingGuard();

  if (!booking?.paid) {
    return null;
  }

  const handleContinue = () => {
    clearBooking();
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', p: 3, textAlign: 'center' }}>
      <Typography data-testid="confirmation-heading" variant="h4" sx={{ mb: 2 }}>
        Payment successful
      </Typography>
      <Typography data-testid="confirmation-message" sx={{ mb: 3 }}>
        Your tickets will be sent shortly to {booking.email}
      </Typography>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={handleContinue}>
        Continue
      </Button>
    </Box>
  );
}
