import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly email = this.bookingService.booking()?.customerEmail ?? '';

  protected continue(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }
}
