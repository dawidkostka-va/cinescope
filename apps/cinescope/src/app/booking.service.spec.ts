import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  beforeEach(() => sessionStorage.clear());

  it('restores the selection from sessionStorage after a reload', () => {
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.toggle({ row: 2, column: 11, couch: false });

    TestBed.resetTestingModule();
    const restored = TestBed.inject(BookingService);
    expect(restored.units()).toEqual([{ row: 2, column: 11, couch: false }]);
    expect(restored.inProgress(1)).toBe(true);
    expect(restored.inProgress(2)).toBe(false);
  });

  it('keeps a paid booking after a reload, outside the in-progress state', () => {
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.toggle({ row: 2, column: 11, couch: false });
    booking.markPaid('anna@example.com');

    TestBed.resetTestingModule();
    const restored = TestBed.inject(BookingService);
    expect(restored.paidEmail()).toBe('anna@example.com');
    expect(restored.inProgress(1)).toBe(false);
  });

  it('starts an empty booking with an empty form when a paid booking is opened again', () => {
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.toggle({ row: 2, column: 11, couch: false });
    booking.updateForm('firstName', 'Anna');
    booking.markPaid('anna@example.com');
    booking.open(1);
    expect(booking.units()).toEqual([]);
    expect(booking.form().firstName).toBe('');
    expect(booking.paidEmail()).toBeNull();
  });

  it('keeps the selection when the same screening is opened again', () => {
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.toggle({ row: 2, column: 11, couch: false });
    booking.open(1);
    expect(booking.seatCount()).toBe(1);
  });

  it('discards the selection when another screening is opened', () => {
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.toggle({ row: 2, column: 11, couch: false });
    booking.open(2);
    expect(booking.units()).toEqual([]);
    expect(booking.inProgress(1)).toBe(false);
  });

  it('counts a couch as two seats and refuses selections above 10 seats', () => {
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    for (let column = 1; column <= 8; column++) {
      booking.toggle({ row: 2, column, couch: false });
    }
    expect(booking.toggle({ row: 15, column: 5, couch: true })).toBe('added');
    expect(booking.seatCount()).toBe(10);
    expect(booking.toggle({ row: 3, column: 1, couch: false })).toBe('limit');
    expect(booking.toggle({ row: 2, column: 1, couch: false })).toBe('removed');
    expect(booking.seatCount()).toBe(9);
  });

  it('removes the booking from sessionStorage when cleared', () => {
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.toggle({ row: 2, column: 11, couch: false });
    booking.clear();
    expect(sessionStorage.getItem('cinescope.booking')).toBeNull();
    expect(booking.units()).toEqual([]);
  });
});
