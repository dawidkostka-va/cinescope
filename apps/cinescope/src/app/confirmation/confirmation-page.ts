import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingStore } from '../booking';

@Component({
  selector: 'app-confirmation-page',
  imports: [MatButtonModule],
  template: `
    <div class="page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p
        data-testid="confirmation-message"
        [textContent]="'Your tickets will be sent shortly to ' + booking.email()"
      ></p>
      <button
        mat-flat-button
        type="button"
        data-testid="confirmation-continue-button"
        (click)="proceed()"
      >
        Continue
      </button>
    </div>
  `,
  styles: `
    .page {
      max-width: 600px;
      margin: 0 auto;
      padding: 48px 24px;
      text-align: center;
    }
  `,
})
export class ConfirmationPage {
  protected readonly booking = inject(BookingStore);
  private readonly router = inject(Router);

  proceed(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
