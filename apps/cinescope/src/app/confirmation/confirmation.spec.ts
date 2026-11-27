import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import type { MockInstance } from 'vitest';
import { BookingService } from '../booking';
import { Confirmation } from './confirmation';

describe('Confirmation', () => {
  let fixture: ComponentFixture<Confirmation>;
  let navigate: MockInstance<Router['navigate']>;

  const el = (testId: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [Confirmation], providers: [provideRouter([])] });
    TestBed.inject(BookingService).save({
      screeningId: 1,
      seats: [{ kind: 'seat', row: 2, column: 6, columnEnd: 6 }],
      paidEmail: 'anna.kowalska@example.com',
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Confirmation);
    fixture.detectChanges();
  });

  it('shows the heading and the email address of the paid booking', () => {
    expect(el('confirmation-heading')?.textContent?.trim()).toBe('Payment successful');
    expect(el('confirmation-message')?.textContent?.trim()).toBe(
      'Your tickets will be sent shortly to anna.kowalska@example.com',
    );
  });

  it('Continue clears the booking and opens the movie list', () => {
    (el('confirmation-continue-button') as HTMLButtonElement).click();

    expect(TestBed.inject(BookingService).current()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
