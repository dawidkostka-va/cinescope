import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  template: `
    <div class="page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ email }}</p>
      <button mat-flat-button type="button" data-testid="confirmation-continue-button" (click)="done()">
        Continue
      </button>
    </div>
  `,
  styles: `
    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 28px;
      font-weight: 500;
    }
  `,
})
export class Confirmation {
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);
  protected readonly email = this.booking.booking()?.email ?? '';

  protected done(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
