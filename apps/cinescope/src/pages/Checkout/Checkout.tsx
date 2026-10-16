import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { createReservation } from '../../api/client';
import { useTicketScreen } from '../../booking/useTicketScreen';
import type { BookingForm } from '../../booking/bookingStore';
import { formatPrice } from '../../format';
import { useToast } from '../../toast/ToastContext';
import { FormTextField } from './FormTextField';
import { validateForm } from './validation';
import './checkout.scss';

type FieldName = keyof BookingForm;

const ALL_TOUCHED: Record<FieldName, boolean> = {
  firstName: true,
  lastName: true,
  email: true,
  confirmEmail: true,
  phone: true,
  terms: true,
};

export function Checkout() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { screeningId, booking, updateBooking, items, total, ready } = useTicketScreen();

  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    terms: false,
  });
  const [submitting, setSubmitting] = useState(false);

  if (!ready || !booking) return null;

  const form = booking.form;
  const errors = validateForm(form);

  function setField(field: FieldName, value: string | boolean) {
    updateBooking((current) => ({ ...current, form: { ...current.form, [field]: value } }));
  }

  function markTouched(field: FieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handlePay() {
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setTouched(ALL_TOUCHED);
      showToast('The form contains errors');
      return;
    }

    setSubmitting(true);
    createReservation({
      screeningId,
      seats: items.flatMap((item) => item.seatIds),
      customer: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
      },
      totalPrice: total,
    })
      .then(() => {
        updateBooking((current) => ({ ...current, paid: true, email: current.form.email }));
        navigate('/confirmation');
      })
      .catch(() => {
        setSubmitting(false);
        showToast('Payment failed. Please try again.');
      });
  }

  return (
    <div className="checkout-page">
      <h1 data-testid="checkout-title">Your details</h1>
      <form className="checkout-form" onSubmit={(event) => event.preventDefault()}>
        <FormTextField
          label="First name *"
          labelTestId="first-name-label"
          inputTestId="first-name-input"
          errorTestId="first-name-error"
          value={form.firstName}
          error={errors.firstName}
          showError={touched.firstName}
          onChange={(value) => setField('firstName', value)}
          onBlur={() => markTouched('firstName')}
        />
        <FormTextField
          label="Last name *"
          labelTestId="last-name-label"
          inputTestId="last-name-input"
          errorTestId="last-name-error"
          value={form.lastName}
          error={errors.lastName}
          showError={touched.lastName}
          onChange={(value) => setField('lastName', value)}
          onBlur={() => markTouched('lastName')}
        />
        <FormTextField
          label="Email *"
          labelTestId="email-label"
          inputTestId="email-input"
          errorTestId="email-error"
          value={form.email}
          error={errors.email}
          showError={touched.email}
          onChange={(value) => setField('email', value)}
          onBlur={() => markTouched('email')}
        />
        <FormTextField
          label="Confirm email *"
          labelTestId="confirm-email-label"
          inputTestId="confirm-email-input"
          errorTestId="confirm-email-error"
          value={form.confirmEmail}
          error={errors.confirmEmail}
          showError={touched.confirmEmail}
          onChange={(value) => setField('confirmEmail', value)}
          onBlur={() => markTouched('confirmEmail')}
        />
        <FormTextField
          label="Phone number"
          labelTestId="phone-label"
          inputTestId="phone-input"
          errorTestId="phone-error"
          value={form.phone}
          error={errors.phone}
          showError={touched.phone}
          onChange={(value) => setField('phone', value)}
          onBlur={() => markTouched('phone')}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={form.terms}
              onChange={(event) => {
                setField('terms', event.target.checked);
                markTouched('terms');
              }}
              slotProps={{ input: { 'data-testid': 'terms-checkbox' } as never }}
            />
          }
          label={<span data-testid="terms-label">I accept the terms and conditions *</span>}
        />
        {touched.terms && errors.terms && (
          <div data-testid="terms-error" className="field-error">
            {errors.terms}
          </div>
        )}
      </form>
      <div className="checkout-actions">
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
