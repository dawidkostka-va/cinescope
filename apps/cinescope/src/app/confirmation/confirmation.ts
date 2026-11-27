import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButton],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);

  /** The customer's email address of the paid booking; the route guard guarantees the booking is paid. */
  protected readonly email = this.bookings.current()?.paidEmail ?? '';

  /** Continue clears the booking and returns to the movie list. */
  protected continue(): void {
    this.bookings.clear();
    void this.router.navigate(['/']);
  }
}
