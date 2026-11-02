import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Api } from '../../core/api';
import { BookingStore } from '../../core/booking';
import { Checkout } from './checkout';

describe('Checkout page', () => {
  it('shows messages only after a field is left and on invalid pay', async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: Api, useValue: {} }] });
    const store = TestBed.inject(BookingStore);
    store.openFor(1);
    store.setItems([
      { row: 7, columnStart: 12, columnEnd: 12, couch: false, ids: ['R7C12'], price: 32 },
    ]);
    const fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const q = (id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);

    expect(q('pay-button')!.textContent!.trim()).toBe('Pay 32.00 PLN');
    expect(q('first-name-error')).toBeNull();
    const input = q('first-name-input') as HTMLInputElement;
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(q('first-name-error')!.textContent).toBe('First name is required');
    input.value = 'A';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(q('first-name-error')!.textContent).toBe('First name must be at least 2 characters');
    expect(store.booking()!.form.firstName).toBe('A');

    expect(q('email-error')).toBeNull();
    q('pay-button')!.click();
    await fixture.whenStable();
    expect(q('email-error')!.textContent).toBe('Email is required');
    expect(q('terms-error')!.textContent).toBe('You must accept the terms and conditions');
    expect(q('phone-error')).toBeNull();
  });
});
