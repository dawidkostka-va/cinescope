import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createReservation } from '../../api/client';
import { useBooking } from '../../booking/BookingContext';
import { CheckoutFormValues } from '../../booking/types';
import { useToast } from '../../components/Toast/ToastContext';
import { formatPrice, toSummaryItems } from '../../lib/seats';
import { getCheckoutErrors } from '../../lib/validation';

type TouchedState = Record<keyof CheckoutFormValues, boolean>;

const initialTouched: TouchedState = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  acceptedTerms: false,
};

export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, setFormField, markPaid } = useBooking();
  const { showToast } = useToast();

  const [touched, setTouched] = useState<TouchedState>(initialTouched);
  const [submitting, setSubmitting] = useState(false);

  const bookingValid =
    !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;

  useEffect(() => {
    if (!bookingValid) navigate('/', { replace: true });
  }, [bookingValid, navigate]);

  if (!bookingValid || !booking) return null;

  const form = booking.form;
  const errors = getCheckoutErrors(form);
  const items = toSummaryItems(booking.seats);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  function markTouched(field: keyof CheckoutFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function onPay() {
    const currentErrors = getCheckoutErrors(form);
    if (Object.keys(currentErrors).length > 0) {
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        confirmEmail: true,
        phone: true,
        acceptedTerms: true,
      });
      showToast('The form contains errors');
      return;
    }
    setSubmitting(true);
    try {
      const seatsInOrder = items.flatMap((item) => item.identifiers);
      await createReservation({
        screeningId,
        seats: seatsInOrder,
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        totalPrice: total,
      });
      markPaid(form.email);
      navigate('/confirmation');
    } catch {
      showToast('Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      <Typography data-testid="checkout-title" variant="h4" sx={{ mb: 2 }}>
        Your details
      </Typography>

      <Stack spacing={1}>
        <TextField
          data-testid="first-name-input"
          label="First name *"
          slotProps={{
            inputLabel: { 'data-testid': 'first-name-label' },
            formHelperText: { 'data-testid': 'first-name-error' },
          }}
          value={form.firstName}
          onChange={(e) => setFormField('firstName', e.target.value)}
          onBlur={() => markTouched('firstName')}
          error={touched.firstName && !!errors.firstName}
          helperText={touched.firstName ? errors.firstName : undefined}
          fullWidth
        />

        <TextField
          data-testid="last-name-input"
          label="Last name *"
          slotProps={{
            inputLabel: { 'data-testid': 'last-name-label' },
            formHelperText: { 'data-testid': 'last-name-error' },
          }}
          value={form.lastName}
          onChange={(e) => setFormField('lastName', e.target.value)}
          onBlur={() => markTouched('lastName')}
          error={touched.lastName && !!errors.lastName}
          helperText={touched.lastName ? errors.lastName : undefined}
          fullWidth
        />

        <TextField
          data-testid="email-input"
          label="Email *"
          slotProps={{
            inputLabel: { 'data-testid': 'email-label' },
            formHelperText: { 'data-testid': 'email-error' },
          }}
          value={form.email}
          onChange={(e) => setFormField('email', e.target.value)}
          onBlur={() => markTouched('email')}
          error={touched.email && !!errors.email}
          helperText={touched.email ? errors.email : undefined}
          fullWidth
        />

        <TextField
          data-testid="confirm-email-input"
          label="Confirm email *"
          slotProps={{
            inputLabel: { 'data-testid': 'confirm-email-label' },
            formHelperText: { 'data-testid': 'confirm-email-error' },
          }}
          value={form.confirmEmail}
          onChange={(e) => setFormField('confirmEmail', e.target.value)}
          onBlur={() => markTouched('confirmEmail')}
          error={touched.confirmEmail && !!errors.confirmEmail}
          helperText={touched.confirmEmail ? errors.confirmEmail : undefined}
          fullWidth
        />

        <TextField
          data-testid="phone-input"
          label="Phone number"
          slotProps={{
            inputLabel: { 'data-testid': 'phone-label' },
            formHelperText: { 'data-testid': 'phone-error' },
          }}
          value={form.phone}
          onChange={(e) => setFormField('phone', e.target.value)}
          onBlur={() => markTouched('phone')}
          error={touched.phone && !!errors.phone}
          helperText={touched.phone ? errors.phone : undefined}
          fullWidth
        />

        <FormControlLabel
          control={
            <Checkbox
              data-testid="terms-checkbox"
              checked={form.acceptedTerms}
              onChange={(e) => {
                setFormField('acceptedTerms', e.target.checked);
                markTouched('acceptedTerms');
              }}
            />
          }
          label={<span data-testid="terms-label">I accept the terms and conditions *</span>}
        />
        {touched.acceptedTerms && errors.terms && (
          <FormHelperText data-testid="terms-error" error>
            {errors.terms}
          </FormHelperText>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button
          data-testid="checkout-back-button"
          variant="outlined"
          onClick={() => navigate(`/screenings/${screeningId}/summary`)}
        >
          Back
        </Button>
        <Button data-testid="pay-button" variant="contained" disabled={submitting} onClick={onPay}>
          {submitting ? 'Processing…' : `Pay ${formatPrice(total)}`}
        </Button>
      </Stack>
    </div>
  );
}

export default Checkout;
