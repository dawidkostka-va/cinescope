import { TestBed } from '@angular/core/testing';
import { BookingService, emptyCheckoutForm } from './booking.service';

describe('BookingService', () => {
  beforeEach(() => sessionStorage.clear());

  it('restores the booking from sessionStorage in a new instance, as after a reload', () => {
    const first = TestBed.inject(BookingService);
    first.open(1);
    first.setSeats(['R7C12']);
    first.markPaid('anna@example.com');

    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(BookingService);
    expect(reloaded.booking()).toEqual({
      screeningId: 1,
      seats: ['R7C12'],
      form: emptyCheckoutForm(),
      paidEmail: 'anna@example.com',
    });
  });

  it('keeps an unpaid booking for the same screening when it is opened again', () => {
    const service = TestBed.inject(BookingService);
    service.open(1);
    service.setSeats(['R7C12']);
    service.open(1);
    expect(service.booking()?.seats).toEqual(['R7C12']);
  });

  it('starts an empty booking after a paid one for the same screening', () => {
    const service = TestBed.inject(BookingService);
    service.open(1);
    service.setSeats(['R7C12']);
    service.markPaid('anna@example.com');
    service.open(1);
    expect(service.booking()).toEqual({ screeningId: 1, seats: [], form: emptyCheckoutForm(), paidEmail: null });
  });

  it('clears the booking and its stored copy', () => {
    const service = TestBed.inject(BookingService);
    service.open(1);
    service.clear();
    expect(service.booking()).toBeNull();
    expect(sessionStorage.getItem('cinescope.booking')).toBeNull();
  });
});
