import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  template: `
    <h1 data-testid="confirmation-heading">Payment successful</h1>
    <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ email }}</p>
    <button matButton="filled" type="button" data-testid="confirmation-continue-button" (click)="done()">Continue</button>
  `,
  styles: ':host { display: block; max-width: 900px; margin: 0 auto; padding: 24px; }',
})
export class ConfirmationComponent {
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly email = this.booking.booking()?.email ?? '';

  protected done(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
