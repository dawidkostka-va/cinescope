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
import { formatPrice } from '../../domain/pricing';
import { getSortedSelectedUnits, getTotalPrice, unitToSeatIds } from '../../domain/seatSelection';
import {
  isUsableBookingFor,
  readBooking,
  writeBooking,
  type Booking,
  type BookingFormValues,
} from '../../booking/bookingStorage';
import { useToast } from '../../components/ToastProvider';
import { dataTestId } from '../../components/testId';
import {
  validateConfirmEmail,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePhone,
  validateTerms,
} from './validation';

interface Touched {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  confirmEmail: boolean;
  phone: boolean;
  terms: boolean;
}

const NOT_TOUCHED: Touched = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  terms: false,
};

export function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const showToast = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [touched, setTouched] = useState<Touched>(NOT_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const existing = readBooking();
    if (!isUsableBookingFor(existing, screeningId)) {
      navigate('/', { replace: true });
      return;
    }
    setBooking(existing);
    setTouched(NOT_TOUCHED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  if (!booking) {
    return null;
  }

  const values = booking.formValues;
  const units = getSortedSelectedUnits(booking.seats);
  const total = getTotalPrice(units);

  const updateField = <K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) => {
    const next = { ...booking, formValues: { ...booking.formValues, [field]: value } };
    writeBooking(next);
    setBooking(next);
  };

  const markTouched = (field: keyof Touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const errors = {
    firstName: validateFirstName(values.firstName),
    lastName: validateLastName(values.lastName),
    email: validateEmail(values.email),
    confirmEmail: validateConfirmEmail(values.confirmEmail, values.email),
    phone: validatePhone(values.phone),
    terms: validateTerms(values.termsAccepted),
  };

  const handlePay = async () => {
    const hasErrors = Object.values(errors).some((message) => message !== null);
    if (hasErrors) {
      setTouched({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });
      showToast('The form contains errors');
      return;
    }

    setSubmitting(true);
    try {
      await createReservation({
        screeningId,
        seats: units.flatMap(unitToSeatIds),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: total,
      });
      const next = { ...booking, paid: true, customerEmail: values.email };
      writeBooking(next);
      navigate('/confirmation');
    } catch {
      setSubmitting(false);
      showToast('Payment failed. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
      <Typography data-testid="checkout-title" variant="h5">
        Your details
      </Typography>

      <Box>
        <TextField
          data-testid="first-name-input"
          label="First name *"
          slotProps={{ inputLabel: dataTestId('first-name-label') }}
          fullWidth
          value={values.firstName}
          onChange={(e) => updateField('firstName', e.target.value)}
          onBlur={() => markTouched('firstName')}
          error={touched.firstName && !!errors.firstName}
        />
        {touched.firstName && errors.firstName && (
          <FormHelperText data-testid="first-name-error" error>
            {errors.firstName}
          </FormHelperText>
        )}
      </Box>

      <Box>
        <TextField
          data-testid="last-name-input"
          label="Last name *"
          slotProps={{ inputLabel: dataTestId('last-name-label') }}
          fullWidth
          value={values.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          onBlur={() => markTouched('lastName')}
          error={touched.lastName && !!errors.lastName}
        />
        {touched.lastName && errors.lastName && (
          <FormHelperText data-testid="last-name-error" error>
            {errors.lastName}
          </FormHelperText>
        )}
      </Box>

      <Box>
        <TextField
          data-testid="email-input"
          label="Email *"
          slotProps={{ inputLabel: dataTestId('email-label') }}
          fullWidth
          value={values.email}
          onChange={(e) => updateField('email', e.target.value)}
          onBlur={() => markTouched('email')}
          error={touched.email && !!errors.email}
        />
        {touched.email && errors.email && (
          <FormHelperText data-testid="email-error" error>
            {errors.email}
          </FormHelperText>
        )}
      </Box>

      <Box>
        <TextField
          data-testid="confirm-email-input"
          label="Confirm email *"
          slotProps={{ inputLabel: dataTestId('confirm-email-label') }}
          fullWidth
          value={values.confirmEmail}
          onChange={(e) => updateField('confirmEmail', e.target.value)}
          onBlur={() => markTouched('confirmEmail')}
          error={touched.confirmEmail && !!errors.confirmEmail}
        />
        {touched.confirmEmail && errors.confirmEmail && (
          <FormHelperText data-testid="confirm-email-error" error>
            {errors.confirmEmail}
          </FormHelperText>
        )}
      </Box>

      <Box>
        <TextField
          data-testid="phone-input"
          label="Phone number"
          slotProps={{ inputLabel: dataTestId('phone-label') }}
          fullWidth
          value={values.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          onBlur={() => markTouched('phone')}
          error={touched.phone && !!errors.phone}
        />
        {touched.phone && errors.phone && (
          <FormHelperText data-testid="phone-error" error>
            {errors.phone}
          </FormHelperText>
        )}
      </Box>

      <Box>
        <FormControlLabel
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
          data-testid="terms-label"
        />
        {touched.terms && errors.terms && (
          <FormHelperText data-testid="terms-error" error>
            {errors.terms}
          </FormHelperText>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
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
