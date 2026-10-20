import { ChangeEvent, FocusEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Booking, CheckoutValues, loadBooking, saveBooking } from '../../booking';
import { createReservation } from '../../api';
import { getBookingItems, totalPrice } from '../../seatUtils';
import { useToast } from '../../toast/ToastProvider';
import { validate, FieldErrors } from './checkoutValidation';

type TouchedState = Record<keyof FieldErrors, boolean>;

const INITIAL_TOUCHED: TouchedState = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  terms: false,
};

interface TextFieldRowProps {
  id: string;
  label: string;
  labelTestId: string;
  inputTestId: string;
  errorTestId: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
  showError: boolean;
  errorMessage?: string;
}

function TextFieldRow({
  id,
  label,
  labelTestId,
  inputTestId,
  errorTestId,
  value,
  onChange,
  onBlur,
  showError,
  errorMessage,
}: TextFieldRowProps) {
  return (
    <Box>
      <Typography component="label" htmlFor={id} data-testid={labelTestId} sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <TextField
        id={id}
        fullWidth
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={showError}
        slotProps={{ htmlInput: { 'data-testid': inputTestId } }}
      />
      {showError && (
        <FormHelperText error data-testid={errorTestId}>
          {errorMessage}
        </FormHelperText>
      )}
    </Box>
  );
}

export function CheckoutPage() {
  const { screeningId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [guardFailed, setGuardFailed] = useState(false);
  const [touched, setTouched] = useState<TouchedState>(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const existing = loadBooking();
    if (
      !existing ||
      existing.paid ||
      existing.screeningId !== Number(screeningId) ||
      existing.seats.length === 0
    ) {
      setGuardFailed(true);
      navigate('/', { replace: true });
      return;
    }
    setBooking(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  if (guardFailed || !booking) {
    return null;
  }

  const values = booking.checkout;
  const errors = validate(values);
  const total = totalPrice(booking.seats);

  function updateValues(partial: Partial<CheckoutValues>) {
    if (!booking) return;
    const updated = { ...booking, checkout: { ...booking.checkout, ...partial } };
    setBooking(updated);
    saveBooking(updated);
  }

  function markTouched(field: keyof TouchedState) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleBack() {
    navigate(`/screenings/${screeningId}/summary`);
  }

  async function handlePay() {
    if (!booking) return;
    const currentErrors = validate(booking.checkout);
    if (Object.keys(currentErrors).length > 0) {
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
      const items = getBookingItems(booking.seats);
      const seats = items.flatMap((item) => item.ids);
      await createReservation({
        screeningId: Number(screeningId),
        seats,
        customer: {
          firstName: booking.checkout.firstName,
          lastName: booking.checkout.lastName,
          email: booking.checkout.email,
          phone: booking.checkout.phone,
        },
        totalPrice: total,
      });
      const updated = { ...booking, paid: true, customerEmail: booking.checkout.email };
      saveBooking(updated);
      navigate('/confirmation');
    } catch {
      setSubmitting(false);
      showToast('Payment failed. Please try again.');
    }
  }

  const fieldError = (field: keyof FieldErrors) => touched[field] && Boolean(errors[field]);

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', p: 3 }}>
      <Typography variant="h4" data-testid="checkout-title" gutterBottom>
        Your details
      </Typography>

      <Stack spacing={2}>
        <TextFieldRow
          id="first-name"
          label="First name *"
          labelTestId="first-name-label"
          inputTestId="first-name-input"
          errorTestId="first-name-error"
          value={values.firstName}
          onChange={(e) => updateValues({ firstName: e.target.value })}
          onBlur={() => markTouched('firstName')}
          showError={fieldError('firstName')}
          errorMessage={errors.firstName}
        />

        <TextFieldRow
          id="last-name"
          label="Last name *"
          labelTestId="last-name-label"
          inputTestId="last-name-input"
          errorTestId="last-name-error"
          value={values.lastName}
          onChange={(e) => updateValues({ lastName: e.target.value })}
          onBlur={() => markTouched('lastName')}
          showError={fieldError('lastName')}
          errorMessage={errors.lastName}
        />

        <TextFieldRow
          id="email"
          label="Email *"
          labelTestId="email-label"
          inputTestId="email-input"
          errorTestId="email-error"
          value={values.email}
          onChange={(e) => updateValues({ email: e.target.value })}
          onBlur={() => markTouched('email')}
          showError={fieldError('email')}
          errorMessage={errors.email}
        />

        <TextFieldRow
          id="confirm-email"
          label="Confirm email *"
          labelTestId="confirm-email-label"
          inputTestId="confirm-email-input"
          errorTestId="confirm-email-error"
          value={values.confirmEmail}
          onChange={(e) => updateValues({ confirmEmail: e.target.value })}
          onBlur={() => markTouched('confirmEmail')}
          showError={fieldError('confirmEmail')}
          errorMessage={errors.confirmEmail}
        />

        <TextFieldRow
          id="phone"
          label="Phone number"
          labelTestId="phone-label"
          inputTestId="phone-input"
          errorTestId="phone-error"
          value={values.phone}
          onChange={(e) => updateValues({ phone: e.target.value })}
          onBlur={() => markTouched('phone')}
          showError={fieldError('phone')}
          errorMessage={errors.phone}
        />

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                data-testid="terms-checkbox"
                checked={values.acceptTerms}
                onChange={(e) => {
                  updateValues({ acceptTerms: e.target.checked });
                  markTouched('terms');
                }}
              />
            }
            label={<span data-testid="terms-label">I accept the terms and conditions *</span>}
          />
          {fieldError('terms') && (
            <FormHelperText error data-testid="terms-error">
              {errors.terms}
            </FormHelperText>
          )}
        </Box>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button data-testid="checkout-back-button" variant="outlined" onClick={handleBack}>
          Back
        </Button>
        <Button data-testid="pay-button" variant="contained" disabled={submitting} onClick={handlePay}>
          {submitting ? 'Processing…' : `Pay ${total.toFixed(2)} PLN`}
        </Button>
      </Stack>
    </Box>
  );
}
