import { CheckoutForm, checkoutErrorMessage, createCheckoutForm } from './checkout-form';

function filledForm(): CheckoutForm {
  const form = createCheckoutForm(undefined);
  form.patchValue({
    firstName: 'Anna',
    lastName: 'Kowalska',
    email: 'anna@example.com',
    confirmEmail: 'anna@example.com',
    phone: '',
    terms: true,
  });
  return form;
}

describe('checkout form rules', () => {
  it('is valid when every required field is filled and the phone is empty', () => {
    expect(filledForm().valid).toBe(true);
  });

  it('shows no message before a field has been left', () => {
    const form = createCheckoutForm(undefined);
    expect(checkoutErrorMessage(form, 'firstName')).toBeNull();
    expect(checkoutErrorMessage(form, 'terms')).toBeNull();
  });

  it('requires first and last name, at least 2 characters each', () => {
    const form = createCheckoutForm(undefined);
    form.controls.firstName.markAsTouched();
    expect(checkoutErrorMessage(form, 'firstName')).toBe('First name is required');

    form.controls.firstName.setValue('A');
    expect(checkoutErrorMessage(form, 'firstName')).toBe(
      'First name must be at least 2 characters',
    );

    form.controls.firstName.setValue('Al');
    expect(checkoutErrorMessage(form, 'firstName')).toBeNull();

    form.controls.lastName.markAsTouched();
    expect(checkoutErrorMessage(form, 'lastName')).toBe('Last name is required');
    form.controls.lastName.setValue('K');
    expect(checkoutErrorMessage(form, 'lastName')).toBe('Last name must be at least 2 characters');
  });

  it('accepts only valid email addresses', () => {
    const form = createCheckoutForm(undefined);
    form.controls.email.markAsTouched();
    expect(checkoutErrorMessage(form, 'email')).toBe('Email is required');

    for (const invalid of [
      'not-an-email',
      'a@b',
      'a@.com',
      'a@b.',
      ' anna@example.com',
      'a b@c.com',
    ]) {
      form.controls.email.setValue(invalid);
      expect(checkoutErrorMessage(form, 'email')).toBe('Enter a valid email address');
    }

    form.controls.email.setValue('anna@example.com');
    expect(checkoutErrorMessage(form, 'email')).toBeNull();
  });

  it('requires the confirmation to match Email as typed', () => {
    const form = filledForm();
    form.controls.confirmEmail.setValue('');
    form.controls.confirmEmail.markAsTouched();
    expect(checkoutErrorMessage(form, 'confirmEmail')).toBe('Confirm email is required');

    form.controls.confirmEmail.setValue('anna@example.org');
    expect(checkoutErrorMessage(form, 'confirmEmail')).toBe('Email addresses do not match');
    expect(form.valid).toBe(false);
  });

  it('re-checks the confirmation when Email changes', () => {
    const form = filledForm();
    form.controls.email.setValue('other@example.com');
    expect(form.controls.confirmEmail.valid).toBe(false);

    form.controls.confirmEmail.setValue('other@example.com');
    expect(form.controls.confirmEmail.valid).toBe(true);
  });

  it('checks a restored confirmation against the restored Email', () => {
    const form = createCheckoutForm({
      firstName: 'Anna',
      lastName: 'Kowalska',
      email: 'anna@example.com',
      confirmEmail: 'anna@example.com',
      phone: '',
      terms: true,
    });
    expect(form.valid).toBe(true);
  });

  it('treats an empty phone as valid and otherwise requires exactly 9 digits', () => {
    const form = filledForm();
    form.controls.phone.markAsTouched();
    expect(checkoutErrorMessage(form, 'phone')).toBeNull();

    for (const invalid of ['12345678', '1234567890', '12345678a', '123 45678']) {
      form.controls.phone.setValue(invalid);
      expect(checkoutErrorMessage(form, 'phone')).toBe('Phone number must be exactly 9 digits');
    }

    form.controls.phone.setValue('123456789');
    expect(checkoutErrorMessage(form, 'phone')).toBeNull();
  });

  it('requires the terms checkbox once it has been toggled', () => {
    const form = filledForm();
    form.controls.terms.setValue(false);
    form.controls.terms.markAsTouched();
    expect(checkoutErrorMessage(form, 'terms')).toBe('You must accept the terms and conditions');
    expect(form.valid).toBe(false);
  });

  it('restores the given values', () => {
    const form = createCheckoutForm({
      firstName: 'Anna',
      lastName: 'K',
      email: 'a',
      confirmEmail: 'b',
      phone: '123',
      terms: true,
    });
    expect(form.getRawValue()).toEqual({
      firstName: 'Anna',
      lastName: 'K',
      email: 'a',
      confirmEmail: 'b',
      phone: '123',
      terms: true,
    });
  });
});
