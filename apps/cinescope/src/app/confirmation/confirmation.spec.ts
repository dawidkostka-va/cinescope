import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { BookingService, paidBookingGuard } from '../booking';
import { Confirmation } from './confirmation';

const PAID_BOOKING = {
  screeningId: 1,
  seats: ['R7C12'],
  checkout: {
    firstName: 'Anna',
    lastName: 'Kowalska',
    email: 'anna.kowalska@example.com',
    confirmEmail: 'anna.kowalska@example.com',
    phone: '',
    terms: true,
  },
  paidEmail: 'anna.kowalska@example.com',
};

function text(fixture: ComponentFixture<Confirmation>, testId: string): string | null {
  return (
    (
      fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null
    )?.textContent?.trim() ?? null
  );
}

describe('Confirmation', () => {
  let fixture: ComponentFixture<Confirmation>;
  let booking: BookingService;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    sessionStorage.setItem('cinescope.booking', JSON.stringify(PAID_BOOKING));
    await TestBed.configureTestingModule({
      imports: [Confirmation],
      providers: [provideRouter([])],
    }).compileComponents();

    booking = TestBed.inject(BookingService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Confirmation);
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows the heading and the message with the paid email address', () => {
    expect(text(fixture, 'confirmation-heading')).toBe('Payment successful');
    expect(text(fixture, 'confirmation-message')).toBe(
      'Your tickets will be sent shortly to anna.kowalska@example.com',
    );
  });

  it('clears the booking and navigates to / on Continue', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    (
      fixture.nativeElement.querySelector(
        '[data-testid="confirmation-continue-button"]',
      ) as HTMLButtonElement
    ).click();

    expect(booking.current()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});

describe('paidBookingGuard', () => {
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function check(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => paidBookingGuard({} as never, [] as never)) as
      | boolean
      | UrlTree;
  }

  it('allows a paid booking', () => {
    sessionStorage.setItem('cinescope.booking', JSON.stringify(PAID_BOOKING));
    expect(check()).toBe(true);
  });

  it('redirects to / for an unpaid booking or no booking', () => {
    sessionStorage.setItem(
      'cinescope.booking',
      JSON.stringify({ screeningId: 1, seats: ['R7C12'] }),
    );
    expect(check()).toEqual(router.createUrlTree(['/']));

    sessionStorage.clear();
    expect(check()).toEqual(router.createUrlTree(['/']));
  });
});
