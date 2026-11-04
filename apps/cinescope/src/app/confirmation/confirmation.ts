import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly router = inject(Router);
  private readonly bookings = inject(BookingService);

  protected readonly email = this.bookings.booking()?.paidEmail ?? '';

  protected finish(): void {
    this.bookings.clear();
    this.router.navigateByUrl('/');
  }
}
