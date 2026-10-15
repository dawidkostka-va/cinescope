import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { InputLabelProps } from '@mui/material/InputLabel';
import { createReservation } from '../../api/client';
import { useBooking } from '../../booking/BookingContext';
import { useBookingGuard } from '../../booking/useBookingGuard';
import { CheckoutFormValues } from '../../booking/types';
import { useToast } from '../../toast/ToastContext';
import { formatPrice, unitIds, unitPrice, unitsFromSeats } from '../../seating/units';
import {
  validateConfirmEmail,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePhone,
  validateTerms,
} from './validation';
import styles from './CheckoutPage.module.scss';

interface Touched {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  confirmEmail: boolean;
  phone: boolean;
  terms: boolean;
}

function labelSlotProps(testId: string): InputLabelProps {
  return { 'data-testid': testId } as InputLabelProps;
}

const INITIAL_TOUCHED: Touched = {
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
  const { booking, setFormField, markPaid } = useBooking();
  const { showToast } = useToast();

  const allowed = useBookingGuard(
    () => !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0,
  );

  const [touched, setTouched] = useState<Touched>(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  const units = useMemo(() => unitsFromSeats(booking?.seats ?? []), [booking]);
  const total = useMemo(() => units.reduce((sum, unit) => sum + unitPrice(unit), 0), [units]);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  if (!booking) {
    return null;
  }

  const values = booking.formValues;

  const setField = <K extends keyof CheckoutFormValues>(key: K, value: CheckoutFormValues[K]) => {
    setFormField(key, value);
  };

  const errors = {
    firstName: validateFirstName(values.firstName),
    lastName: validateLastName(values.lastName),
    email: validateEmail(values.email),
    confirmEmail: validateConfirmEmail(values.confirmEmail, values.email),
    phone: validatePhone(values.phone),
    terms: validateTerms(values.termsAccepted),
  };

  const markTouched = (field: keyof Touched) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  const handlePay = () => {
    if (submitting) return;

    const hasErrors = Object.values(errors).some((message) => message !== null);
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
    const seats = units.flatMap(unitIds);
    createReservation({
      screeningId,
      seats,
      customer: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      },
      totalPrice: total,
    })
      .then(() => {
        markPaid(values.email);
        navigate('/confirmation');
      })
      .catch(() => {
        setSubmitting(false);
        showToast('Payment failed. Please try again.');
      });
  };

  return (
    <div className={styles.page}>
      <Typography variant="h4" data-testid="checkout-title">
        Your details
      </Typography>

      <div className={styles.field}>
        <TextField
          fullWidth
          label="First name *"
          data-testid="first-name-input"
          slotProps={{ inputLabel: labelSlotProps('first-name-label') }}
          value={values.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          onBlur={markTouched('firstName')}
          error={touched.firstName && !!errors.firstName}
        />
        {touched.firstName && errors.firstName && (
          <FormHelperText data-testid="first-name-error" error>
            {errors.firstName}
          </FormHelperText>
        )}
      </div>

      <div className={styles.field}>
        <TextField
          fullWidth
          label="Last name *"
          data-testid="last-name-input"
          slotProps={{ inputLabel: labelSlotProps('last-name-label') }}
          value={values.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          onBlur={markTouched('lastName')}
          error={touched.lastName && !!errors.lastName}
        />
        {touched.lastName && errors.lastName && (
          <FormHelperText data-testid="last-name-error" error>
            {errors.lastName}
          </FormHelperText>
        )}
      </div>

      <div className={styles.field}>
        <TextField
          fullWidth
          label="Email *"
          data-testid="email-input"
          slotProps={{ inputLabel: labelSlotProps('email-label') }}
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          onBlur={markTouched('email')}
          error={touched.email && !!errors.email}
        />
        {touched.email && errors.email && (
          <FormHelperText data-testid="email-error" error>
            {errors.email}
          </FormHelperText>
        )}
      </div>

      <div className={styles.field}>
        <TextField
          fullWidth
          label="Confirm email *"
          data-testid="confirm-email-input"
          slotProps={{ inputLabel: labelSlotProps('confirm-email-label') }}
          value={values.confirmEmail}
          onChange={(e) => setField('confirmEmail', e.target.value)}
          onBlur={markTouched('confirmEmail')}
          error={touched.confirmEmail && !!errors.confirmEmail}
        />
        {touched.confirmEmail && errors.confirmEmail && (
          <FormHelperText data-testid="confirm-email-error" error>
            {errors.confirmEmail}
          </FormHelperText>
        )}
      </div>

      <div className={styles.field}>
        <TextField
          fullWidth
          label="Phone number"
          data-testid="phone-input"
          slotProps={{ inputLabel: labelSlotProps('phone-label') }}
          value={values.phone}
          onChange={(e) => setField('phone', e.target.value)}
          onBlur={markTouched('phone')}
          error={touched.phone && !!errors.phone}
        />
        {touched.phone && errors.phone && (
          <FormHelperText data-testid="phone-error" error>
            {errors.phone}
          </FormHelperText>
        )}
      </div>

      <div className={styles.field}>
        <FormControlLabel
          data-testid="terms-label"
          control={
            <Checkbox
              data-testid="terms-checkbox"
              checked={values.termsAccepted}
              onChange={(e) => {
                setField('termsAccepted', e.target.checked);
                setTouched((prev) => ({ ...prev, terms: true }));
              }}
            />
          }
          label="I accept the terms and conditions *"
        />
        {touched.terms && errors.terms && (
          <FormHelperText data-testid="terms-error" error>
            {errors.terms}
          </FormHelperText>
        )}
      </div>

      <div className={styles.actions}>
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
