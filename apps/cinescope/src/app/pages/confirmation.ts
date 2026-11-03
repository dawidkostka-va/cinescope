import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  template: `
    <div class="page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ booking.booking()?.email }}</p>
      <div class="actions">
        <button mat-flat-button data-testid="confirmation-continue-button" (click)="done()">Continue</button>
      </div>
    </div>
  `,
  styles: `
    .page {
      text-align: center;
    }
  `,
})
export class ConfirmationPage {
  private readonly router = inject(Router);
  protected readonly booking = inject(BookingService);

  protected done(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
