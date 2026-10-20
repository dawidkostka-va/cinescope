import Button from '@mui/material/Button';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../booking/BookingContext';
import styles from './ConfirmationPage.module.scss';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { booking, clearBooking } = useBooking();

  useEffect(() => {
    if (!booking || !booking.paid) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!booking || !booking.paid) {
    return null;
  }

  function handleContinue(): void {
    clearBooking();
    navigate('/');
  }

  return (
    <div className={styles.page}>
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {booking.customerEmail}</p>
      <Button data-testid="confirmation-continue-button" variant="contained" onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}
