import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import { useBooking } from '../../lib/booking-context';
import { useToast } from '../../lib/toast-context';
import { createReservation } from '../../lib/api';
import { computeSelectionUnits, formatPrice, unitPrice } from '../../lib/seat-geometry';
import {
  validateConfirmEmail,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePhone,
  validateTerms,
} from '../../lib/validation';
import './checkout.scss';

interface Touched {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  confirmEmail: boolean;
  phone: boolean;
  terms: boolean;
}

const INITIAL_TOUCHED: Touched = {
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
  const { booking, updateForm, markPaid } = useBooking();
  const { showToast } = useToast();

  const [touched, setTouched] = useState<Touched>(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  const bookingValid =
    booking !== null &&
    !booking.paid &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0;

  useEffect(() => {
    if (!bookingValid) {
      navigate('/', { replace: true });
    }
  }, [bookingValid, navigate]);

  const units = useMemo(
    () => (booking ? computeSelectionUnits(booking.seats) : []),
    [booking],
  );
  const total = units.reduce((sum, unit) => sum + unitPrice(unit), 0);

  if (!bookingValid || !booking) {
    return null;
  }

  const { form } = booking;

  const errors = {
    firstName: validateFirstName(form.firstName),
    lastName: validateLastName(form.lastName),
    email: validateEmail(form.email),
    confirmEmail: validateConfirmEmail(form.email, form.confirmEmail),
    phone: validatePhone(form.phone),
    terms: validateTerms(form.terms),
  };

  const hasErrors = Object.values(errors).some((error) => error !== null);

  const handleBlur = (field: keyof Touched) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePay = async () => {
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
      await createReservation({
        screeningId,
        seats: units.flatMap((unit) => unit.ids),
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
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1 data-testid="checkout-title">Your details</h1>

      <div className="field">
        <Typography component="label" data-testid="first-name-label" htmlFor="first-name-input">
          First name *
        </Typography>
        <TextField
          id="first-name-input"
          data-testid="first-name-input"
          value={form.firstName}
          onChange={(e) => updateForm({ firstName: e.target.value })}
          onBlur={handleBlur('firstName')}
        />
        {touched.firstName && errors.firstName && (
          <div data-testid="first-name-error">{errors.firstName}</div>
        )}
      </div>

      <div className="field">
        <Typography component="label" data-testid="last-name-label" htmlFor="last-name-input">
          Last name *
        </Typography>
        <TextField
          id="last-name-input"
          data-testid="last-name-input"
          value={form.lastName}
          onChange={(e) => updateForm({ lastName: e.target.value })}
          onBlur={handleBlur('lastName')}
        />
        {touched.lastName && errors.lastName && (
          <div data-testid="last-name-error">{errors.lastName}</div>
        )}
      </div>

      <div className="field">
        <Typography component="label" data-testid="email-label" htmlFor="email-input">
          Email *
        </Typography>
        <TextField
          id="email-input"
          data-testid="email-input"
          value={form.email}
          onChange={(e) => updateForm({ email: e.target.value })}
          onBlur={handleBlur('email')}
        />
        {touched.email && errors.email && <div data-testid="email-error">{errors.email}</div>}
      </div>

      <div className="field">
        <Typography component="label" data-testid="confirm-email-label" htmlFor="confirm-email-input">
          Confirm email *
        </Typography>
        <TextField
          id="confirm-email-input"
          data-testid="confirm-email-input"
          value={form.confirmEmail}
          onChange={(e) => updateForm({ confirmEmail: e.target.value })}
          onBlur={handleBlur('confirmEmail')}
        />
        {touched.confirmEmail && errors.confirmEmail && (
          <div data-testid="confirm-email-error">{errors.confirmEmail}</div>
        )}
      </div>

      <div className="field">
        <Typography component="label" data-testid="phone-label" htmlFor="phone-input">
          Phone number
        </Typography>
        <TextField
          id="phone-input"
          data-testid="phone-input"
          value={form.phone}
          onChange={(e) => updateForm({ phone: e.target.value })}
          onBlur={handleBlur('phone')}
        />
        {touched.phone && errors.phone && <div data-testid="phone-error">{errors.phone}</div>}
      </div>

      <div className="field">
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
          label={
            <span data-testid="terms-label">I accept the terms and conditions *</span>
          }
        />
        {touched.terms && errors.terms && <div data-testid="terms-error">{errors.terms}</div>}
      </div>

      <div className="actions">
        <Button
          data-testid="checkout-back-button"
          variant="outlined"
          onClick={() => navigate(`/screenings/${screeningId}/summary`)}
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
      </div>
    </div>
  );
}

export default Checkout;
