import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../core/booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  protected readonly email = this.bookingService.booking()?.paidEmail ?? '';

  protected continue(): void {
    this.bookingService.clear();
    void this.router.navigate(['/']);
  }
}
