import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly email = computed(() => this.bookingService.booking()?.email ?? '');

  continue(): void {
    this.bookingService.clear();
    this.router.navigate(['/']);
  }
}
