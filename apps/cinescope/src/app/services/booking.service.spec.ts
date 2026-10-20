import { beforeEach, describe, expect, it } from 'vitest';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts a new empty booking for a screening', () => {
    const service = new BookingService();
    service.ensureBookingForScreening(1);
    expect(service.booking()).toMatchObject({ screeningId: 1, seats: [], paid: false });
  });

  it('keeps the booking when reopening the same unpaid screening', () => {
    const service = new BookingService();
    service.ensureBookingForScreening(1);
    service.toggleUnit(['R7C12']);
    service.ensureBookingForScreening(1);
    expect(service.booking()?.seats).toEqual(['R7C12']);
  });

  it('discards the previous booking when switching screenings', () => {
    const service = new BookingService();
    service.ensureBookingForScreening(1);
    service.toggleUnit(['R7C12']);
    service.ensureBookingForScreening(2);
    expect(service.booking()).toMatchObject({ screeningId: 2, seats: [] });
  });

  it('toggles a seat on and off', () => {
    const service = new BookingService();
    service.ensureBookingForScreening(1);
    expect(service.toggleUnit(['R7C12'])).toBe(true);
    expect(service.isSeatSelected('R7C12')).toBe(true);
    expect(service.toggleUnit(['R7C12'])).toBe(true);
    expect(service.isSeatSelected('R7C12')).toBe(false);
  });

  it('rejects a selection that would exceed 10 seats, without affecting the existing selection', () => {
    const service = new BookingService();
    service.ensureBookingForScreening(1);
    for (let i = 1; i <= 10; i++) {
      expect(service.toggleUnit([`R2C${i}`])).toBe(true);
    }
    expect(service.toggleUnit(['R2C11'])).toBe(false);
    expect(service.seatCount()).toBe(10);
  });

  it('a couch counts as 2 seats and can push past the cap', () => {
    const service = new BookingService();
    service.ensureBookingForScreening(1);
    for (let i = 1; i <= 9; i++) {
      service.toggleUnit([`R2C${i}`]);
    }
    expect(service.toggleUnit(['R15C1', 'R15C2'])).toBe(false);
    expect(service.seatCount()).toBe(9);
  });

  it('persists the booking in sessionStorage across instances', () => {
    const service = new BookingService();
    service.ensureBookingForScreening(1);
    service.toggleUnit(['R7C12']);
    const reloaded = new BookingService();
    expect(reloaded.booking()?.seats).toEqual(['R7C12']);
  });

  it('clear() removes the booking', () => {
    const service = new BookingService();
    service.ensureBookingForScreening(1);
    service.clear();
    expect(service.booking()).toBeNull();
    expect(new BookingService().booking()).toBeNull();
  });
});
