import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  template: `
    <div class="page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ email() }}</p>
      <button mat-flat-button type="button" data-testid="confirmation-continue-button" (click)="finish()">
        Continue
      </button>
    </div>
  `,
  styles: `
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
  `,
})
export class Confirmation {
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);
  protected readonly email = computed(() => this.bookingService.booking()?.email ?? '');

  protected finish() {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }
}
