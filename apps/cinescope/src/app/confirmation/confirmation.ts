import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButton],
  template: `
    <div class="page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ email() }}</p>
      <button matButton="filled" data-testid="confirmation-continue-button" (click)="done()">Continue</button>
    </div>
  `,
})
export class Confirmation {
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);
  protected readonly email = () => this.booking.booking()?.email ?? '';

  protected done(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
