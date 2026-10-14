import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { useToast } from '../../context/ToastContext';
import { createReservation } from '../../lib/api';
import { CheckoutForm } from '../../lib/booking';
import { CheckoutField, validateCheckoutForm } from '../../lib/checkoutValidation';
import { buildBookingItems, formatPrice } from '../../lib/seats';
import { useUnpaidBookingGuard } from '../../routes/useBookingGuard';

const INITIAL_TOUCHED: Record<CheckoutField, boolean> = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  terms: false,
};

export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const { showToast } = useToast();

  useUnpaidBookingGuard(screeningId);

  const [touched, setTouched] = useState<Record<CheckoutField, boolean>>(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  if (!booking) {
    return null;
  }

  const form = booking.form;
  const errors = validateCheckoutForm(form);
  const items = buildBookingItems(booking.seats);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  function setField<K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]) {
    updateBooking((b) => ({ ...b, form: { ...b.form, [field]: value } }));
  }

  const markTouched = (field: CheckoutField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePay = async () => {
    if (Object.keys(errors).length > 0) {
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
      const seats = items.flatMap((item) => item.ids);
      await createReservation({
        screeningId: booking.screeningId,
        seats,
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        totalPrice: total,
      });
      updateBooking((b) => ({ ...b, paid: true, email: b.form.email }));
      navigate('/confirmation');
    } catch {
      showToast('Payment failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', p: 3 }}>
      <Typography data-testid="checkout-title" variant="h4" sx={{ mb: 3 }}>
        Your details
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          data-testid="first-name-input"
          label="First name *"
          value={form.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          onBlur={() => markTouched('firstName')}
          error={touched.firstName && !!errors.firstName}
          slotProps={{ inputLabel: { 'data-testid': 'first-name-label' } as object }}
        />
        {touched.firstName && errors.firstName && (
          <Typography data-testid="first-name-error" color="error" variant="caption">
            {errors.firstName}
          </Typography>
        )}

        <TextField
          data-testid="last-name-input"
          label="Last name *"
          value={form.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          onBlur={() => markTouched('lastName')}
          error={touched.lastName && !!errors.lastName}
          slotProps={{ inputLabel: { 'data-testid': 'last-name-label' } as object }}
        />
        {touched.lastName && errors.lastName && (
          <Typography data-testid="last-name-error" color="error" variant="caption">
            {errors.lastName}
          </Typography>
        )}

        <TextField
          data-testid="email-input"
          label="Email *"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          onBlur={() => markTouched('email')}
          error={touched.email && !!errors.email}
          slotProps={{ inputLabel: { 'data-testid': 'email-label' } as object }}
        />
        {touched.email && errors.email && (
          <Typography data-testid="email-error" color="error" variant="caption">
            {errors.email}
          </Typography>
        )}

        <TextField
          data-testid="confirm-email-input"
          label="Confirm email *"
          value={form.confirmEmail}
          onChange={(e) => setField('confirmEmail', e.target.value)}
          onBlur={() => markTouched('confirmEmail')}
          error={touched.confirmEmail && !!errors.confirmEmail}
          slotProps={{ inputLabel: { 'data-testid': 'confirm-email-label' } as object }}
        />
        {touched.confirmEmail && errors.confirmEmail && (
          <Typography data-testid="confirm-email-error" color="error" variant="caption">
            {errors.confirmEmail}
          </Typography>
        )}

        <TextField
          data-testid="phone-input"
          label="Phone number"
          value={form.phone}
          onChange={(e) => setField('phone', e.target.value)}
          onBlur={() => markTouched('phone')}
          error={touched.phone && !!errors.phone}
          slotProps={{ inputLabel: { 'data-testid': 'phone-label' } as object }}
        />
        {touched.phone && errors.phone && (
          <Typography data-testid="phone-error" color="error" variant="caption">
            {errors.phone}
          </Typography>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={form.terms}
              onChange={(e) => {
                setField('terms', e.target.checked);
                markTouched('terms');
              }}
              slotProps={{ input: { 'data-testid': 'terms-checkbox' } as object }}
            />
          }
          label={<Typography data-testid="terms-label">I accept the terms and conditions *</Typography>}
        />
        {touched.terms && errors.terms && (
          <Typography data-testid="terms-error" color="error" variant="caption">
            {errors.terms}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
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
      </Box>
    </Box>
  );
}
