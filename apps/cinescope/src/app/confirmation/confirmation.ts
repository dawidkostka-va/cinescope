import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingStore } from '../booking/booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButton],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly bookings = inject(BookingStore);
  private readonly router = inject(Router);

  /** The customer's email, read once: the booking is cleared on `Continue`. */
  protected readonly email = this.bookings.booking()?.paidEmail ?? '';

  protected onContinue(): void {
    this.bookings.clear();
    void this.router.navigate(['/']);
  }
}
