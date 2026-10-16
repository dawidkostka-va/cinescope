import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../booking/BookingContext';

export function ConfirmationPage() {
  const { booking, clear } = useBooking();
  const navigate = useNavigate();
  const email = booking?.email ?? '';

  function handleContinue() {
    clear();
    navigate('/');
  }

  return (
    <div className="confirmation-page" style={{ maxWidth: 600, margin: '0 auto', padding: 24, textAlign: 'center' }}>
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {email}</p>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}

export default ConfirmationPage;
