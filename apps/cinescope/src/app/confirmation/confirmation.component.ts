import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent {
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  readonly email = this.booking.booking()?.paidEmail ?? '';

  continue(): void {
    this.booking.clear();
    this.router.navigate(['/']);
  }
}
