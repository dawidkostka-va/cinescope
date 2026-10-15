import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createReservation } from '../../api/client';
import { useBooking } from '../../booking/BookingContext';
import { useBookingGuard } from '../../booking/useBookingGuard';
import type { CheckoutFormValues } from '../../booking/types';
import { summarySeatIds, totalPrice } from '../../domain/bookingItems';
import { formatPrice } from '../../domain/seatMap';
import { useToast } from '../../toast/ToastContext';
import {
  type CheckoutErrors,
  hasErrors,
  validateForm,
} from './validation';

type FieldName = keyof CheckoutFormValues;

export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const { showToast } = useToast();
  const guardPassed = useBookingGuard({
    requireScreeningId: screeningId,
    requirePaid: false,
    requireSeats: true,
  });

  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    terms: false,
  });
  const [submitting, setSubmitting] = useState(false);

  if (!guardPassed || !booking) {
    return null;
  }

  const values = booking.form;
  const errors: CheckoutErrors = validateForm(values);
  const total = totalPrice(booking.seats);

  function setField<K extends FieldName>(field: K, value: CheckoutFormValues[K]) {
    updateBooking((current) => ({ ...current, form: { ...current.form, [field]: value } }));
  }

  function markTouched(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handlePay() {
    if (hasErrors(errors)) {
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        confirmEmail: true,
        phone: true,
        terms: true,
      });
      showToast('The form contains errors');
      return;
    }

    setSubmitting(true);
    try {
      await createReservation({
        screeningId,
        seats: summarySeatIds(booking.seats),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: total,
      });
      updateBooking((current) => ({ ...current, paid: true, email: values.email }));
      navigate('/confirmation');
    } catch {
      showToast('Payment failed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <Typography data-testid="checkout-title" variant="h4" align="center" gutterBottom>
        Your details
      </Typography>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label data-testid="first-name-label" htmlFor="first-name-input">
            First name *
          </label>
          <TextField
            id="first-name-input"
            data-testid="first-name-input"
            fullWidth
            value={values.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            onBlur={() => markTouched('firstName')}
          />
          {touched.firstName && errors.firstName && (
            <div data-testid="first-name-error">{errors.firstName}</div>
          )}
        </div>

        <div>
          <label data-testid="last-name-label" htmlFor="last-name-input">
            Last name *
          </label>
          <TextField
            id="last-name-input"
            data-testid="last-name-input"
            fullWidth
            value={values.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            onBlur={() => markTouched('lastName')}
          />
          {touched.lastName && errors.lastName && (
            <div data-testid="last-name-error">{errors.lastName}</div>
          )}
        </div>

        <div>
          <label data-testid="email-label" htmlFor="email-input">
            Email *
          </label>
          <TextField
            id="email-input"
            data-testid="email-input"
            fullWidth
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => markTouched('email')}
          />
          {touched.email && errors.email && <div data-testid="email-error">{errors.email}</div>}
        </div>

        <div>
          <label data-testid="confirm-email-label" htmlFor="confirm-email-input">
            Confirm email *
          </label>
          <TextField
            id="confirm-email-input"
            data-testid="confirm-email-input"
            fullWidth
            value={values.confirmEmail}
            onChange={(e) => setField('confirmEmail', e.target.value)}
            onBlur={() => markTouched('confirmEmail')}
          />
          {touched.confirmEmail && errors.confirmEmail && (
            <div data-testid="confirm-email-error">{errors.confirmEmail}</div>
          )}
        </div>

        <div>
          <label data-testid="phone-label" htmlFor="phone-input">
            Phone number
          </label>
          <TextField
            id="phone-input"
            data-testid="phone-input"
            fullWidth
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
            onBlur={() => markTouched('phone')}
          />
          {touched.phone && errors.phone && <div data-testid="phone-error">{errors.phone}</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Checkbox
            data-testid="terms-checkbox"
            checked={values.terms}
            onChange={(e) => {
              setField('terms', e.target.checked);
              markTouched('terms');
            }}
          />
          <label data-testid="terms-label">I accept the terms and conditions *</label>
        </div>
        {touched.terms && errors.terms && <div data-testid="terms-error">{errors.terms}</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
        <Button
          data-testid="checkout-back-button"
          variant="outlined"
          onClick={() => navigate(`/screenings/${screeningId}/summary`)}
        >
          Back
        </Button>
        <Button data-testid="pay-button" variant="contained" disabled={submitting} onClick={handlePay}>
          {submitting ? 'Processing…' : `Pay ${formatPrice(total)}`}
        </Button>
      </div>
    </div>
  );
}
