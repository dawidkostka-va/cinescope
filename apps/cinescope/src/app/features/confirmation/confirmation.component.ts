import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.component.html',
})
export class ConfirmationComponent {
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly email = computed(() => this.bookingService.booking()?.email ?? '');

  protected continue(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }
}
