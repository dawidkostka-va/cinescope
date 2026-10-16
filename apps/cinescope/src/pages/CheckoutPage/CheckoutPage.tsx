import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createReservation } from '../../api/client';
import { useBooking } from '../../booking/BookingContext';
import { useToast } from '../../toast/ToastContext';
import { priceForItem } from '../../utils/pricing';
import { flattenItemsToIds, groupSeatIds } from '../../utils/seats';
import { validateCheckoutForm } from './validation';
import './CheckoutPage.scss';

interface Touched {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  confirmEmail: boolean;
  phone: boolean;
  terms: boolean;
}

const NO_TOUCHED: Touched = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  terms: false,
};

const ALL_TOUCHED: Touched = {
  firstName: true,
  lastName: true,
  email: true,
  confirmEmail: true,
  phone: true,
  terms: true,
};

export function CheckoutPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, updateForm, markPaid } = useBooking();
  const { showToast } = useToast();

  const [touched, setTouched] = useState<Touched>(NO_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  if (!booking) return null;

  const form = booking.form;
  const errors = validateCheckoutForm(form);
  const items = groupSeatIds(booking.seats);
  const total = items.reduce((sum, item) => sum + priceForItem(item), 0);

  function blurField(field: keyof Touched) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handlePay() {
    const currentErrors = validateCheckoutForm(form);
    if (Object.keys(currentErrors).length > 0) {
      setTouched(ALL_TOUCHED);
      showToast('The form contains errors');
      return;
    }

    setSubmitting(true);
    createReservation({
      screeningId,
      seats: flattenItemsToIds(items),
      customer: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
      },
      totalPrice: total,
    })
      .then(() => {
        markPaid(form.email);
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

      <div className="checkout-page__field">
        <TextField
          fullWidth
          data-testid="first-name-input"
          label={<span data-testid="first-name-label">First name *</span>}
          value={form.firstName}
          onChange={(e) => updateForm({ firstName: e.target.value })}
          onBlur={() => blurField('firstName')}
          error={touched.firstName && !!errors.firstName}
        />
        {touched.firstName && errors.firstName && (
          <div className="checkout-page__error" data-testid="first-name-error">
            {errors.firstName}
          </div>
        )}
      </div>

      <div className="checkout-page__field">
        <TextField
          fullWidth
          data-testid="last-name-input"
          label={<span data-testid="last-name-label">Last name *</span>}
          value={form.lastName}
          onChange={(e) => updateForm({ lastName: e.target.value })}
          onBlur={() => blurField('lastName')}
          error={touched.lastName && !!errors.lastName}
        />
        {touched.lastName && errors.lastName && (
          <div className="checkout-page__error" data-testid="last-name-error">
            {errors.lastName}
          </div>
        )}
      </div>

      <div className="checkout-page__field">
        <TextField
          fullWidth
          data-testid="email-input"
          label={<span data-testid="email-label">Email *</span>}
          value={form.email}
          onChange={(e) => updateForm({ email: e.target.value })}
          onBlur={() => blurField('email')}
          error={touched.email && !!errors.email}
        />
        {touched.email && errors.email && (
          <div className="checkout-page__error" data-testid="email-error">
            {errors.email}
          </div>
        )}
      </div>

      <div className="checkout-page__field">
        <TextField
          fullWidth
          data-testid="confirm-email-input"
          label={<span data-testid="confirm-email-label">Confirm email *</span>}
          value={form.confirmEmail}
          onChange={(e) => updateForm({ confirmEmail: e.target.value })}
          onBlur={() => blurField('confirmEmail')}
          error={touched.confirmEmail && !!errors.confirmEmail}
        />
        {touched.confirmEmail && errors.confirmEmail && (
          <div className="checkout-page__error" data-testid="confirm-email-error">
            {errors.confirmEmail}
          </div>
        )}
      </div>

      <div className="checkout-page__field">
        <TextField
          fullWidth
          data-testid="phone-input"
          label={<span data-testid="phone-label">Phone number</span>}
          value={form.phone}
          onChange={(e) => updateForm({ phone: e.target.value })}
          onBlur={() => blurField('phone')}
          error={touched.phone && !!errors.phone}
        />
        {touched.phone && errors.phone && (
          <div className="checkout-page__error" data-testid="phone-error">
            {errors.phone}
          </div>
        )}
      </div>

      <div className="checkout-page__field">
        <FormControlLabel
          control={
            <Checkbox
              data-testid="terms-checkbox"
              checked={form.terms}
              onChange={(e) => {
                updateForm({ terms: e.target.checked });
                setTouched((prev) => ({ ...prev, terms: true }));
              }}
            />
          }
          label={<span data-testid="terms-label">I accept the terms and conditions *</span>}
        />
        {touched.terms && errors.terms && (
          <div className="checkout-page__error" data-testid="terms-error">
            {errors.terms}
          </div>
        )}
      </div>

      <div className="checkout-page__actions">
        <Button
          data-testid="checkout-back-button"
          variant="outlined"
          onClick={() => navigate(`/screenings/${screeningId}/summary`)}
        >
          Back
        </Button>
        <Button data-testid="pay-button" variant="contained" disabled={submitting} onClick={handlePay}>
          {submitting ? 'Processing…' : `Pay ${total.toFixed(2)} PLN`}
        </Button>
      </div>
    </div>
  );
}

export default CheckoutPage;
