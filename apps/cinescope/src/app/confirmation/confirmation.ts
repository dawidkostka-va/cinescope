import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking.service';

@Component({
  selector: 'app-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <div class="page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ email }}</p>
      <button mat-flat-button type="button" data-testid="confirmation-continue-button" (click)="finish()">
        Continue
      </button>
    </div>
  `,
  styles: `
    .page {
      max-width: 700px;
      margin: 0 auto;
      padding: 24px;
    }
  `,
})
export class Confirmation {
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);
  readonly email = this.booking.booking()?.email ?? '';

  finish(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
