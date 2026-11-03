import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking.service';
import { AUDITORIUM } from './seat-layout';

describe('BookingService', () => {
  const seats = AUDITORIUM.flatMap((r) => r.middle).filter((i) => !i.couch);
  const couch = AUDITORIUM[14].middle[0];
  let service: BookingService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookingService);
    service.open(1);
  });

  it('selects and deselects, and counts a couch as 2', () => {
    service.toggle(seats[0]);
    service.toggle(couch);
    expect(service.seatCount()).toBe(3);
    service.toggle(couch);
    service.toggle(seats[0]);
    expect(service.seatCount()).toBe(0);
  });

  it('refuses to exceed 10 seats but still deselects', () => {
    for (let i = 0; i < 9; i++) service.toggle(seats[i]);
    expect(service.toggle(couch)).toBe('limit');
    expect(service.seatCount()).toBe(9);
    expect(service.toggle(seats[9])).toBe('ok');
    expect(service.toggle(seats[10])).toBe('limit');
    service.toggle(seats[0]);
    expect(service.seatCount()).toBe(9);
  });

  it('persists to sessionStorage and starts a new booking for another screening', () => {
    service.toggle(seats[0]);
    expect(JSON.parse(sessionStorage.getItem('cinescope.booking')!).seats).toEqual([seats[0].key]);
    service.open(1);
    expect(service.seatCount()).toBe(1);
    service.open(2);
    expect(service.seatCount()).toBe(0);
  });

  it('sums the total', () => {
    service.toggle(seats[0]);
    service.toggle(couch);
    expect(service.total()).toBe(25 + 89);
  });
});
