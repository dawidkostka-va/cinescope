import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class ConfirmationComponent {
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly email = this.bookings.get()?.paidEmail ?? '';

  protected continue(): void {
    this.bookings.clear();
    this.router.navigateByUrl('/');
  }
}
