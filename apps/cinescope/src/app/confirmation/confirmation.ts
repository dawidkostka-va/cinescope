import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingStore } from '../booking';

/** `Payment successful` (section 8): the paid booking's email, and `Continue` back to the movie list. */
@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly router = inject(Router);
  private readonly booking = inject(BookingStore);

  /** Email address of the paid booking; the guard guarantees the booking exists and is paid. */
  protected readonly email = this.booking.read()?.paidEmail ?? '';

  /** Clears the booking and returns to the movie list. */
  protected proceed(): void {
    this.booking.clear();
    this.router.navigate(['/']);
  }
}
