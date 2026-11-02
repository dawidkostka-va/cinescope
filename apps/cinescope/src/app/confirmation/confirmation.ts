import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { BookingService } from '../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButton],
  templateUrl: './confirmation.html',
})
export class Confirmation {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  protected readonly email = this.bookingService.booking()?.email ?? '';

  protected continue(): void {
    this.bookingService.set(null);
    void this.router.navigate(['/']);
  }
}
