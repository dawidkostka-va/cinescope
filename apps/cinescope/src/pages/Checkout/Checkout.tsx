import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useBooking } from '../../lib/bookingContext';
import { useToast } from '../../components/Toast/ToastProvider';
import { createReservation } from '../../lib/api';
import { CheckoutFormValues } from '../../lib/types';
import { formatPrice, totalPrice, toSelectionUnits } from '../../lib/seats';
import {
  validateConfirmEmail,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePhone,
  validateTerms,
} from '../../lib/validation';

type FieldName = keyof CheckoutFormValues;

export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, setForm, pay } = useBooking();
  const { showToast } = useToast();

  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    terms: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const bookingIsValid =
    !!booking &&
    !booking.paid &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0;

  useEffect(() => {
    if (!bookingIsValid) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bookingIsValid || !booking) {
    return null;
  }

  const form = booking.form;
  const total = totalPrice(booking.seats);

  const errors = {
    firstName: validateFirstName(form.firstName),
    lastName: validateLastName(form.lastName),
    email: validateEmail(form.email),
    confirmEmail: validateConfirmEmail(form.email, form.confirmEmail),
    phone: validatePhone(form.phone),
    terms: validateTerms(form.terms),
  };

  const updateField = <K extends FieldName>(field: K, value: CheckoutFormValues[K]) => {
    setForm({ ...form, [field]: value });
  };

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePay = async () => {
    const hasErrors = Object.values(errors).some((error) => error !== null);
    if (hasErrors) {
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
      const seats = toSelectionUnits(booking.seats).flatMap((unit) => unit.seatIds);
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
      pay(form.email);
      navigate('/confirmation');
    } catch {
      setSubmitting(false);
      showToast('Payment failed. Please try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography data-testid="checkout-title" variant="h5" sx={{ mb: 2 }}>
        Your details
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="First name *"
          value={form.firstName}
          onChange={(e) => updateField('firstName', e.target.value)}
          onBlur={() => handleBlur('firstName')}
          error={touched.firstName && !!errors.firstName}
          helperText={touched.firstName ? errors.firstName ?? undefined : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'first-name-input' },
            inputLabel: { 'data-testid': 'first-name-label' } as never,
            formHelperText: { 'data-testid': 'first-name-error' } as never,
          }}
        />

        <TextField
          label="Last name *"
          value={form.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          onBlur={() => handleBlur('lastName')}
          error={touched.lastName && !!errors.lastName}
          helperText={touched.lastName ? errors.lastName ?? undefined : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'last-name-input' },
            inputLabel: { 'data-testid': 'last-name-label' } as never,
            formHelperText: { 'data-testid': 'last-name-error' } as never,
          }}
        />

        <TextField
          label="Email *"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          error={touched.email && !!errors.email}
          helperText={touched.email ? errors.email ?? undefined : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'email-input' },
            inputLabel: { 'data-testid': 'email-label' } as never,
            formHelperText: { 'data-testid': 'email-error' } as never,
          }}
        />

        <TextField
          label="Confirm email *"
          value={form.confirmEmail}
          onChange={(e) => updateField('confirmEmail', e.target.value)}
          onBlur={() => handleBlur('confirmEmail')}
          error={touched.confirmEmail && !!errors.confirmEmail}
          helperText={touched.confirmEmail ? errors.confirmEmail ?? undefined : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'confirm-email-input' },
            inputLabel: { 'data-testid': 'confirm-email-label' } as never,
            formHelperText: { 'data-testid': 'confirm-email-error' } as never,
          }}
        />

        <TextField
          label="Phone number"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          error={touched.phone && !!errors.phone}
          helperText={touched.phone ? errors.phone ?? undefined : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'phone-input' },
            inputLabel: { 'data-testid': 'phone-label' } as never,
            formHelperText: { 'data-testid': 'phone-error' } as never,
          }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.terms}
              onChange={(e) => {
                updateField('terms', e.target.checked);
                handleBlur('terms');
              }}
              slotProps={{ input: { 'data-testid': 'terms-checkbox' } as never }}
            />
          }
          label={<span data-testid="terms-label">I accept the terms and conditions *</span>}
        />
        {touched.terms && errors.terms && (
          <Typography data-testid="terms-error" color="error" variant="caption">
            {errors.terms}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button
          data-testid="checkout-back-button"
          variant="outlined"
          onClick={() => navigate(`/screenings/${booking.screeningId}/summary`)}
        >
          Back
        </Button>
        <Button
          data-testid="pay-button"
          variant="contained"
          disabled={submitting}
          onClick={handlePay}
        >
          {submitting ? 'Processing…' : `Pay ${formatPrice(total)}`}
        </Button>
      </Stack>
    </Box>
  );
}
