import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  protected readonly email = computed(() => this.bookingService.booking()?.email ?? '');

  protected continue(): void {
    this.bookingService.clear();
    this.router.navigate(['/']);
  }
}
