import { FormControl, FormGroup } from '@angular/forms';
import {
  confirmEmailValidator,
  emailValidator,
  minLengthField,
  phoneValidator,
} from './validators';

const msg = (v: (c: FormControl) => unknown, value: string) =>
  (v(new FormControl(value)) as { message: string } | null)?.message ?? null;

describe('checkout validators', () => {
  it('validates names', () => {
    const v = minLengthField('First name');
    expect(msg(v, '')).toBe('First name is required');
    expect(msg(v, 'A')).toBe('First name must be at least 2 characters');
    expect(msg(v, 'Al')).toBeNull();
  });

  it('validates email', () => {
    expect(msg(emailValidator, '')).toBe('Email is required');
    for (const bad of ['not-an-email', 'a@b', 'a@.com', 'a b@c.com']) {
      expect(msg(emailValidator, bad)).toBe('Enter a valid email address');
    }
    expect(msg(emailValidator, 'anna@example.com')).toBeNull();
  });

  it('validates phone', () => {
    expect(msg(phoneValidator, '')).toBeNull();
    expect(msg(phoneValidator, '12345678')).toBe('Phone number must be exactly 9 digits');
    expect(msg(phoneValidator, '123 456 78')).toBe('Phone number must be exactly 9 digits');
    expect(msg(phoneValidator, '123456789')).toBeNull();
  });

  it('compares confirm email with email', () => {
    const group = new FormGroup({
      email: new FormControl('a@b.pl'),
      confirmEmail: new FormControl('x', confirmEmailValidator),
    });
    expect(group.controls.confirmEmail.errors?.['message']).toBe('Email addresses do not match');
    group.controls.confirmEmail.setValue('a@b.pl');
    expect(group.controls.confirmEmail.errors).toBeNull();
  });
});
