import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  protected readonly email = this.booking.booking()?.paidEmail ?? '';

  protected finish(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
