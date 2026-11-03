import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { BookingService } from '../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent {
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);

  readonly email = this.bookings.booking()?.paidEmail ?? '';

  finish(): void {
    this.bookings.clear();
    this.router.navigateByUrl('/');
  }
}
