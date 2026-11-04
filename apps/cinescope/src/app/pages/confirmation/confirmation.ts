import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { BookingService } from '../../core/booking.service';

@Component({
  selector: 'app-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <h1 data-testid="confirmation-heading">Payment successful</h1>
    <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ email }}</p>
    <button
      mat-flat-button
      type="button"
      data-testid="confirmation-continue-button"
      (click)="done()"
    >
      Continue
    </button>
  `,
  styles: `
    :host {
      display: block;
      max-width: 700px;
      margin: 0 auto;
      padding: 24px;
      text-align: center;
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
