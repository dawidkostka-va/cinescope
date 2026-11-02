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
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly email = this.booking.booking()?.paidEmail ?? '';

  protected continue(): void {
    this.booking.clear();
    void this.router.navigate(['/']);
  }
}
