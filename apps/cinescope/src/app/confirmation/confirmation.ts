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
  private readonly router = inject(Router);
  private readonly bookings = inject(BookingStore);

  /** The route guard ensures a paid booking exists; its email is the one paid with. */
  readonly email = this.bookings.read()?.paidEmail ?? '';

  /** `Continue` clears the booking and returns to the movie list (section 8). */
  continue(): void {
    this.bookings.clear();
    void this.router.navigate(['/']);
  }
}
