import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createReservation } from '../../api/client';
import { useBooking } from '../../booking/BookingContext';
import { CheckoutForm } from '../../booking/types';
import { useToast } from '../../toast/ToastContext';
import { computeTotal, formatPrice, seatIdsInSummaryOrder } from '../../utils/seats';
import { validateCheckoutForm } from './validation';

type TouchedState = Record<keyof CheckoutForm, boolean>;

const INITIAL_TOUCHED: TouchedState = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  terms: false,
};

export function CheckoutPage() {
  const { id } = useParams();
  const screeningId = Number(id);
  const navigate = useNavigate();
  const { booking, setBooking } = useBooking();
  const showToast = useToast();

  const [touched, setTouched] = useState<TouchedState>(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!booking || booking.paid || booking.screeningId !== screeningId || booking.seats.length === 0) {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!booking || booking.screeningId !== screeningId) {
    return null;
  }

  const form = booking.form;
  const errors = validateCheckoutForm(form);
  const total = computeTotal(booking.seats);

  function updateForm(partial: Partial<CheckoutForm>) {
    if (!booking) return;
    setBooking({ ...booking, form: { ...form, ...partial } });
  }

  function markTouched(field: keyof CheckoutForm) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handlePay() {
    if (!booking) return;
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
      await createReservation({
        screeningId,
        seats: seatIdsInSummaryOrder(booking.seats),
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        totalPrice: total,
      });
      setBooking({ ...booking, paid: true, customerEmail: form.email });
      navigate('/confirmation');
    } catch {
      showToast('Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', p: 3 }}>
      <Typography data-testid="checkout-title" variant="h4" sx={{ mb: 2 }}>
        Your details
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label={<Box component="span" data-testid="first-name-label">First name *</Box>}
          value={form.firstName}
          onChange={(e) => updateForm({ firstName: e.target.value })}
          onBlur={() => markTouched('firstName')}
          error={touched.firstName && Boolean(errors.firstName)}
          slotProps={{ htmlInput: { 'data-testid': 'first-name-input' } as object }}
        />
        {touched.firstName && errors.firstName && (
          <Typography data-testid="first-name-error" color="error" variant="body2">
            {errors.firstName}
          </Typography>
        )}

        <TextField
          label={<Box component="span" data-testid="last-name-label">Last name *</Box>}
          value={form.lastName}
          onChange={(e) => updateForm({ lastName: e.target.value })}
          onBlur={() => markTouched('lastName')}
          error={touched.lastName && Boolean(errors.lastName)}
          slotProps={{ htmlInput: { 'data-testid': 'last-name-input' } as object }}
        />
        {touched.lastName && errors.lastName && (
          <Typography data-testid="last-name-error" color="error" variant="body2">
            {errors.lastName}
          </Typography>
        )}

        <TextField
          label={<Box component="span" data-testid="email-label">Email *</Box>}
          value={form.email}
          onChange={(e) => updateForm({ email: e.target.value })}
          onBlur={() => markTouched('email')}
          error={touched.email && Boolean(errors.email)}
          slotProps={{ htmlInput: { 'data-testid': 'email-input' } as object }}
        />
        {touched.email && errors.email && (
          <Typography data-testid="email-error" color="error" variant="body2">
            {errors.email}
          </Typography>
        )}

        <TextField
          label={<Box component="span" data-testid="confirm-email-label">Confirm email *</Box>}
          value={form.confirmEmail}
          onChange={(e) => updateForm({ confirmEmail: e.target.value })}
          onBlur={() => markTouched('confirmEmail')}
          error={touched.confirmEmail && Boolean(errors.confirmEmail)}
          slotProps={{ htmlInput: { 'data-testid': 'confirm-email-input' } as object }}
        />
        {touched.confirmEmail && errors.confirmEmail && (
          <Typography data-testid="confirm-email-error" color="error" variant="body2">
            {errors.confirmEmail}
          </Typography>
        )}

        <TextField
          label={<Box component="span" data-testid="phone-label">Phone number</Box>}
          value={form.phone}
          onChange={(e) => updateForm({ phone: e.target.value })}
          onBlur={() => markTouched('phone')}
          error={touched.phone && Boolean(errors.phone)}
          slotProps={{ htmlInput: { 'data-testid': 'phone-input' } as object }}
        />
        {touched.phone && errors.phone && (
          <Typography data-testid="phone-error" color="error" variant="body2">
            {errors.phone}
          </Typography>
        )}

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                data-testid="terms-checkbox"
                checked={form.terms}
                onChange={(e) => {
                  updateForm({ terms: e.target.checked });
                  markTouched('terms');
                }}
              />
            }
            label={
              <Box component="span" data-testid="terms-label">
                I accept the terms and conditions *
              </Box>
            }
          />
          {touched.terms && errors.terms && (
            <Typography data-testid="terms-error" color="error" variant="body2">
              {errors.terms}
            </Typography>
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
          {submitting ? 'Processing…' : `Pay ${formatPrice(total)}`}
        </Button>
      </Box>
    </Box>
  );
}
