import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { BookingFormValues, useBooking } from '../booking/BookingContext';
import { useToast } from '../components/Toast';
import { createReservation } from '../api/client';
import { deriveSeatItems, formatPrice } from '../utils/seats';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function firstNameError(value: string): string | null {
  if (value.length === 0) return 'First name is required';
  if (value.length < 2) return 'First name must be at least 2 characters';
  return null;
}
function lastNameError(value: string): string | null {
  if (value.length === 0) return 'Last name is required';
  if (value.length < 2) return 'Last name must be at least 2 characters';
  return null;
}
function emailError(value: string): string | null {
  if (value.length === 0) return 'Email is required';
  if (!EMAIL_REGEX.test(value)) return 'Enter a valid email address';
  return null;
}
function confirmEmailError(email: string, confirmEmail: string): string | null {
  if (confirmEmail.length === 0) return 'Confirm email is required';
  if (confirmEmail !== email) return 'Email addresses do not match';
  return null;
}
function phoneError(value: string): string | null {
  if (value.length === 0) return null;
  if (!/^\d{9}$/.test(value)) return 'Phone number must be exactly 9 digits';
  return null;
}
function termsError(checked: boolean): string | null {
  if (!checked) return 'You must accept the terms and conditions';
  return null;
}

type FieldName = keyof BookingFormValues;

const INITIAL_TOUCHED: Record<FieldName, boolean> = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  termsAccepted: false,
};

export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, setFormField, markPaid } = useBooking();
  const showToast = useToast();

  const [touched, setTouched] = useState<Record<FieldName, boolean>>(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!booking || booking.paid || booking.screeningId !== screeningId || booking.seats.length === 0) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!booking) return null;

  const { form } = booking;
  const items = deriveSeatItems(booking.seats);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  const errors: Record<FieldName, string | null> = {
    firstName: firstNameError(form.firstName),
    lastName: lastNameError(form.lastName),
    email: emailError(form.email),
    confirmEmail: confirmEmailError(form.email, form.confirmEmail),
    phone: phoneError(form.phone),
    termsAccepted: termsError(form.termsAccepted),
  };

  const isValid = Object.values(errors).every((e) => e === null);

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePay = async () => {
    if (!isValid) {
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        confirmEmail: true,
        phone: true,
        termsAccepted: true,
      });
      showToast('The form contains errors');
      return;
    }
    setSubmitting(true);
    try {
      const orderedSeats = items.flatMap((item) => item.ids);
      await createReservation({
        screeningId,
        seats: orderedSeats,
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
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', p: 4 }}>
      <Typography data-testid="checkout-title" variant="h4">
        Your details
      </Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <TextField
          label="First name *"
          value={form.firstName}
          onChange={(e) => setFormField('firstName', e.target.value)}
          onBlur={() => handleBlur('firstName')}
          error={touched.firstName && !!errors.firstName}
          helperText={touched.firstName ? (errors.firstName ?? undefined) : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'first-name-input' },
            inputLabel: { 'data-testid': 'first-name-label' },
            formHelperText: { 'data-testid': 'first-name-error' },
          }}
        />
        <TextField
          label="Last name *"
          value={form.lastName}
          onChange={(e) => setFormField('lastName', e.target.value)}
          onBlur={() => handleBlur('lastName')}
          error={touched.lastName && !!errors.lastName}
          helperText={touched.lastName ? (errors.lastName ?? undefined) : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'last-name-input' },
            inputLabel: { 'data-testid': 'last-name-label' },
            formHelperText: { 'data-testid': 'last-name-error' },
          }}
        />
        <TextField
          label="Email *"
          value={form.email}
          onChange={(e) => setFormField('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          error={touched.email && !!errors.email}
          helperText={touched.email ? (errors.email ?? undefined) : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'email-input' },
            inputLabel: { 'data-testid': 'email-label' },
            formHelperText: { 'data-testid': 'email-error' },
          }}
        />
        <TextField
          label="Confirm email *"
          value={form.confirmEmail}
          onChange={(e) => setFormField('confirmEmail', e.target.value)}
          onBlur={() => handleBlur('confirmEmail')}
          error={touched.confirmEmail && !!errors.confirmEmail}
          helperText={touched.confirmEmail ? (errors.confirmEmail ?? undefined) : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'confirm-email-input' },
            inputLabel: { 'data-testid': 'confirm-email-label' },
            formHelperText: { 'data-testid': 'confirm-email-error' },
          }}
        />
        <TextField
          label="Phone number"
          value={form.phone}
          onChange={(e) => setFormField('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          error={touched.phone && !!errors.phone}
          helperText={touched.phone ? (errors.phone ?? undefined) : undefined}
          slotProps={{
            htmlInput: { 'data-testid': 'phone-input' },
            inputLabel: { 'data-testid': 'phone-label' },
            formHelperText: { 'data-testid': 'phone-error' },
          }}
        />
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.termsAccepted}
                onChange={(e) => {
                  setFormField('termsAccepted', e.target.checked);
                  handleBlur('termsAccepted');
                }}
                slotProps={{ input: { 'data-testid': 'terms-checkbox' } }}
              />
            }
            label={<span data-testid="terms-label">I accept the terms and conditions *</span>}
          />
          {touched.termsAccepted && errors.termsAccepted && (
            <FormHelperText data-testid="terms-error" error>
              {errors.termsAccepted}
            </FormHelperText>
          )}
        </FormGroup>
        <Stack direction="row" spacing={2}>
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
        </Stack>
      </Stack>
    </Box>
  );
}

export default Checkout;
