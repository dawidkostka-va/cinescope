import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingStore } from '../booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly bookings = inject(BookingStore);
  private readonly router = inject(Router);

  /**
   * The customer's email from the paid booking. The route guard guarantees it is set; it is read
   * once so that it does not blank out while `Continue` clears the booking.
   */
  protected readonly email = this.bookings.booking()?.paidEmail ?? '';

  /** Clears the booking and returns to the movie list. */
  protected continue(): void {
    this.bookings.clear();
    this.router.navigate(['/']);
  }
}
