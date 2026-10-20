import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createReservation } from '../../api/client';
import { useBooking } from '../../booking/BookingContext';
import { BookingForm, isBookingUsable } from '../../booking/types';
import { buildBookedItems } from '../../domain/seatLayout';
import { hasCheckoutErrors, validateCheckout } from '../../domain/validation';
import { useToast } from '../../toast/ToastContext';
import styles from './CheckoutPage.module.scss';

type TextFieldKey = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';

const FIELD_TEST_ID: Record<TextFieldKey, string> = {
  firstName: 'first-name',
  lastName: 'last-name',
  email: 'email',
  confirmEmail: 'confirm-email',
  phone: 'phone',
};

const FIELD_LABEL: Record<TextFieldKey, string> = {
  firstName: 'First name *',
  lastName: 'Last name *',
  email: 'Email *',
  confirmEmail: 'Confirm email *',
  phone: 'Phone number',
};

type Touched = Record<TextFieldKey | 'terms', boolean>;

const INITIAL_TOUCHED: Touched = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  terms: false,
};

export function CheckoutPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, updateForm, markPaid } = useBooking();
  const { showToast } = useToast();
  const [touched, setTouched] = useState<Touched>(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isBookingUsable(booking, screeningId)) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!booking || !isBookingUsable(booking, screeningId)) {
    return null;
  }

  const form = booking.form;
  const errors = validateCheckout(form);
  const items = buildBookedItems(booking.seats);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  function handleChange(field: TextFieldKey, value: string): void {
    updateForm({ [field]: value } as Partial<BookingForm>);
  }

  function handleBlur(field: TextFieldKey | 'terms'): void {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handlePay(): Promise<void> {
    if (hasCheckoutErrors(errors)) {
      setTouched({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });
      showToast('The form contains errors');
      return;
    }
    setSubmitting(true);
    try {
      await createReservation({
        screeningId,
        seats: items.flatMap((item) => item.ids),
        customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
        totalPrice: total,
      });
      markPaid(form.email);
      navigate('/confirmation');
    } catch {
      setSubmitting(false);
      showToast('Payment failed. Please try again.');
    }
  }

  function renderField(field: TextFieldKey) {
    const testId = FIELD_TEST_ID[field];
    const message = touched[field] ? errors[field] : null;
    return (
      <div className={styles.field} key={field}>
        <InputLabel data-testid={`${testId}-label`} htmlFor={`${testId}-input-el`}>
          {FIELD_LABEL[field]}
        </InputLabel>
        <TextField
          id={`${testId}-input-el`}
          data-testid={`${testId}-input`}
          size="small"
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          onBlur={() => handleBlur(field)}
          error={!!message}
        />
        {message && (
          <FormHelperText error data-testid={`${testId}-error`}>
            {message}
          </FormHelperText>
        )}
      </div>
    );
  }

  const termsMessage = touched.terms ? errors.terms : null;

  return (
    <div className={styles.page}>
      <h1 data-testid="checkout-title">Your details</h1>

      {renderField('firstName')}
      {renderField('lastName')}
      {renderField('email')}
      {renderField('confirmEmail')}
      {renderField('phone')}

      <div className={styles.checkboxRow}>
        <FormControlLabel
          data-testid="terms-label"
          control={
            <Checkbox
              data-testid="terms-checkbox"
              checked={form.terms}
              onChange={(e) => {
                updateForm({ terms: e.target.checked });
                handleBlur('terms');
              }}
            />
          }
          label="I accept the terms and conditions *"
        />
        {termsMessage && (
          <FormHelperText error data-testid="terms-error">
            {termsMessage}
          </FormHelperText>
        )}
      </div>

      <div className={styles.actions}>
        <Button data-testid="checkout-back-button" variant="outlined" onClick={() => navigate(`/screenings/${screeningId}/summary`)}>
          Back
        </Button>
        <Button data-testid="pay-button" variant="contained" disabled={submitting} onClick={handlePay}>
          {submitting ? 'Processing…' : `Pay ${total.toFixed(2)} PLN`}
        </Button>
      </div>
    </div>
  );
}
