import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { MockInstance } from 'vitest';
import { BookingService } from '../booking.service';
import { Confirmation } from './confirmation';

describe('Confirmation', () => {
  let fixture: ComponentFixture<Confirmation>;
  let navigate: MockInstance;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [Confirmation], providers: [provideRouter([])] });
    const booking = TestBed.inject(BookingService);
    booking.open(1);
    booking.toggle({ row: 2, column: 11, couch: false });
    booking.markPaid('anna@example.com');
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Confirmation);
    fixture.detectChanges();
  });

  function one(testId: string): HTMLElement {
    return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
  }

  it('shows the heading and the message with the customer email', () => {
    expect(one('confirmation-heading').textContent?.trim()).toBe('Payment successful');
    expect(one('confirmation-message').textContent?.trim()).toBe(
      'Your tickets will be sent shortly to anna@example.com',
    );
  });

  it('Continue clears the booking and opens the movie list', () => {
    (one('confirmation-continue-button') as HTMLButtonElement).click();
    expect(sessionStorage.getItem('cinescope.booking')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
