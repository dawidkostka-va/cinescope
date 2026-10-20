import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { useBooking } from '../../lib/booking-context';
import './confirmation.scss';

export function Confirmation() {
  const navigate = useNavigate();
  const { booking, clearBooking } = useBooking();

  const isValid = booking !== null && booking.paid;

  useEffect(() => {
    if (!isValid) {
      navigate('/', { replace: true });
    }
  }, [isValid, navigate]);

  if (!isValid || !booking) {
    return null;
  }

  const handleContinue = () => {
    clearBooking();
    navigate('/');
  };

  return (
    <div className="confirmation-page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">
        Your tickets will be sent shortly to {booking.email}
      </p>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}

export default Confirmation;
