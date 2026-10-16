import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createReservation } from '../../api/client';
import { loadBooking, saveBooking } from '../../booking/storage';
import { Booking, CheckoutForm } from '../../booking/types';
import { useToast } from '../../components/Toast/ToastProvider';
import { getOrderedSeatIds, getTotalPrice } from '../../utils/auditorium';
import { validateConfirmEmail, validateEmail, validatePhone, validateRequiredName, validateTerms } from './validation';

interface TouchedState {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  confirmEmail: boolean;
  phone: boolean;
  terms: boolean;
}

const INITIAL_TOUCHED: TouchedState = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  terms: false,
};

export function Checkout() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [booking, setBookingState] = useState<Booking | null>(null);
  const [values, setValues] = useState<CheckoutForm | null>(null);
  const [touched, setTouched] = useState<TouchedState>(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loaded = loadBooking();
    if (!loaded || loaded.paid || loaded.screeningId !== screeningId || loaded.seats.length === 0) {
      navigate('/', { replace: true });
      return;
    }
    setBookingState(loaded);
    setValues(loaded.form);
  }, [screeningId, navigate]);

  if (!booking || !values) {
    return null;
  }

  const total = getTotalPrice(booking.seats);

  function updateField<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setValues((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      const current = loadBooking();
      if (current) {
        saveBooking({ ...current, form: next });
      }
      return next;
    });
  }

  function markTouched(key: keyof TouchedState) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  const errors = {
    firstName: validateRequiredName(values.firstName, 'First name'),
    lastName: validateRequiredName(values.lastName, 'Last name'),
    email: validateEmail(values.email),
    confirmEmail: validateConfirmEmail(values.email, values.confirmEmail),
    phone: validatePhone(values.phone),
    terms: validateTerms(values.termsAccepted),
  };

  const isValid = Object.values(errors).every((message) => message === null);

  async function handlePay() {
    if (!isValid) {
      setTouched({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });
      showToast('The form contains errors');
      return;
    }

    setSubmitting(true);
    try {
      const orderedSeats = getOrderedSeatIds(booking.seats);
      await createReservation({
        screeningId,
        seats: orderedSeats,
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: total,
      });
      const current = loadBooking();
      if (current) {
        saveBooking({ ...current, paid: true, paidEmail: values.email });
      }
      navigate('/confirmation');
    } catch {
      setSubmitting(false);
      showToast('Payment failed. Please try again.');
    }
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
      <Typography data-testid="checkout-title" variant="h5" sx={{ mb: 2 }}>
        Your details
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          data-testid="first-name-input"
          label="First name *"
          value={values.firstName}
          onChange={(e) => updateField('firstName', e.target.value)}
          onBlur={() => markTouched('firstName')}
          slotProps={{
            inputLabel: { 'data-testid': 'first-name-label' },
            formHelperText: { 'data-testid': 'first-name-error' },
          }}
          error={touched.firstName && errors.firstName !== null}
          helperText={touched.firstName ? (errors.firstName ?? undefined) : undefined}
        />
        <TextField
          data-testid="last-name-input"
          label="Last name *"
          value={values.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          onBlur={() => markTouched('lastName')}
          slotProps={{
            inputLabel: { 'data-testid': 'last-name-label' },
            formHelperText: { 'data-testid': 'last-name-error' },
          }}
          error={touched.lastName && errors.lastName !== null}
          helperText={touched.lastName ? (errors.lastName ?? undefined) : undefined}
        />
        <TextField
          data-testid="email-input"
          label="Email *"
          value={values.email}
          onChange={(e) => updateField('email', e.target.value)}
          onBlur={() => markTouched('email')}
          slotProps={{
            inputLabel: { 'data-testid': 'email-label' },
            formHelperText: { 'data-testid': 'email-error' },
          }}
          error={touched.email && errors.email !== null}
          helperText={touched.email ? (errors.email ?? undefined) : undefined}
        />
        <TextField
          data-testid="confirm-email-input"
          label="Confirm email *"
          value={values.confirmEmail}
          onChange={(e) => updateField('confirmEmail', e.target.value)}
          onBlur={() => markTouched('confirmEmail')}
          slotProps={{
            inputLabel: { 'data-testid': 'confirm-email-label' },
            formHelperText: { 'data-testid': 'confirm-email-error' },
          }}
          error={touched.confirmEmail && errors.confirmEmail !== null}
          helperText={touched.confirmEmail ? (errors.confirmEmail ?? undefined) : undefined}
        />
        <TextField
          data-testid="phone-input"
          label="Phone number"
          value={values.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          onBlur={() => markTouched('phone')}
          slotProps={{
            inputLabel: { 'data-testid': 'phone-label' },
            formHelperText: { 'data-testid': 'phone-error' },
          }}
          error={touched.phone && errors.phone !== null}
          helperText={touched.phone ? (errors.phone ?? undefined) : undefined}
        />
        <Box>
          <FormControlLabel
            data-testid="terms-label"
            control={
              <Checkbox
                data-testid="terms-checkbox"
                checked={values.termsAccepted}
                onChange={(e) => {
                  updateField('termsAccepted', e.target.checked);
                  markTouched('terms');
                }}
              />
            }
            label="I accept the terms and conditions *"
          />
          {touched.terms && errors.terms !== null && (
            <FormHelperText data-testid="terms-error" error>
              {errors.terms}
            </FormHelperText>
          )}
        </Box>
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
          {submitting ? 'Processing…' : `Pay ${total.toFixed(2)} PLN`}
        </Button>
      </Box>
    </Box>
  );
}
