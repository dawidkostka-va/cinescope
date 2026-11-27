import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking';

/** Payment successful (section 8). Reached only with a paid booking, which the route guard checks. */
@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);

  /** The email address the booking was paid with; empty if the booking is not paid. */
  readonly email = this.bookings.load()?.paid?.email ?? '';

  /** Clears the booking and returns to the movie list. */
  continue(): void {
    this.bookings.clear();
    void this.router.navigate(['/']);
  }
}
