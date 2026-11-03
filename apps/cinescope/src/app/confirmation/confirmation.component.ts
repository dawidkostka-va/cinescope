import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent {
  readonly booking = inject(BookingService);
  private readonly router = inject(Router);

  continue(): void {
    this.booking.clear();
    this.router.navigate(['/']);
  }
}
