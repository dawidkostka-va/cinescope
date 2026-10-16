import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createReservation } from '../lib/api';
import { BookingFormValues, getBookingSnapshot, setBooking, useBooking } from '../lib/bookingStore';
import { formatPrice, orderedSeatIds, totalPrice } from '../lib/ticketing';
import { useToast } from '../lib/toast';
import { FormErrors, validateForm } from '../lib/validation';

type TextFieldName = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type FieldName = TextFieldName | 'termsAccepted';

const TEXT_FIELDS: { name: TextFieldName; label: string; testid: string; labelTestid: string; errorTestid: string }[] = [
  { name: 'firstName', label: 'First name *', testid: 'first-name-input', labelTestid: 'first-name-label', errorTestid: 'first-name-error' },
  { name: 'lastName', label: 'Last name *', testid: 'last-name-input', labelTestid: 'last-name-label', errorTestid: 'last-name-error' },
  { name: 'email', label: 'Email *', testid: 'email-input', labelTestid: 'email-label', errorTestid: 'email-error' },
  { name: 'confirmEmail', label: 'Confirm email *', testid: 'confirm-email-input', labelTestid: 'confirm-email-label', errorTestid: 'confirm-email-error' },
  { name: 'phone', label: 'Phone number', testid: 'phone-input', labelTestid: 'phone-label', errorTestid: 'phone-error' },
];

const ALL_TOUCHED: Record<FieldName, boolean> = {
  firstName: true,
  lastName: true,
  email: true,
  confirmEmail: true,
  phone: true,
  termsAccepted: true,
};

export function CheckoutPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const booking = useBooking();
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    termsAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const snapshot = getBookingSnapshot();
    if (!snapshot || snapshot.paid || snapshot.screeningId !== screeningId || snapshot.seats.length === 0) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!booking) {
    return null;
  }

  const currentBooking = booking;
  const errors: FormErrors = validateForm(currentBooking.form);
  const total = totalPrice(currentBooking.seats);

  function updateField<K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) {
    setBooking({ ...currentBooking, form: { ...currentBooking.form, [field]: value } });
  }

  function markTouched(field: FieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handlePay() {
    const currentErrors = validateForm(currentBooking.form);
    if (Object.keys(currentErrors).length > 0) {
      setTouched(ALL_TOUCHED);
      showToast('The form contains errors');
      return;
    }
    setSubmitting(true);
    try {
      const seats = orderedSeatIds(currentBooking.seats);
      await createReservation({
        screeningId,
        seats,
        customer: {
          firstName: currentBooking.form.firstName,
          lastName: currentBooking.form.lastName,
          email: currentBooking.form.email,
          phone: currentBooking.form.phone,
        },
        totalPrice: total,
      });
      setBooking({ ...currentBooking, paid: true, paidEmail: currentBooking.form.email });
      navigate('/confirmation');
    } catch {
      showToast('Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 data-testid="checkout-title">Your details</h1>
      <div>
        {TEXT_FIELDS.map((field) => (
          <div key={field.name}>
            <label data-testid={field.labelTestid} htmlFor={field.name}>
              {field.label}
            </label>
            <TextField
              id={field.name}
              data-testid={field.testid}
              value={booking.form[field.name]}
              onChange={(e) => updateField(field.name, e.target.value)}
              onBlur={() => markTouched(field.name)}
            />
            {touched[field.name] && errors[field.name] && (
              <div data-testid={field.errorTestid}>{errors[field.name]}</div>
            )}
          </div>
        ))}
        <div>
          <FormControlLabel
            control={
              <Checkbox
                id="termsAccepted"
                data-testid="terms-checkbox"
                checked={booking.form.termsAccepted}
                onChange={(e) => {
                  updateField('termsAccepted', e.target.checked);
                  markTouched('termsAccepted');
                }}
              />
            }
            label={<span data-testid="terms-label">I accept the terms and conditions *</span>}
          />
          {touched.termsAccepted && errors.termsAccepted && <div data-testid="terms-error">{errors.termsAccepted}</div>}
        </div>
        <div>
          <Button data-testid="checkout-back-button" onClick={() => navigate(`/screenings/${screeningId}/summary`)}>
            Back
          </Button>
          <Button data-testid="pay-button" disabled={submitting} onClick={handlePay}>
            {submitting ? 'Processing…' : `Pay ${formatPrice(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
