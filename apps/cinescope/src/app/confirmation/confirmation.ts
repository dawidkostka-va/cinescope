import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingStore } from '../core/booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  template: `
    <div class="page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ email }}</p>
      <button mat-flat-button type="button" data-testid="confirmation-continue-button" (click)="done()">Continue</button>
    </div>
  `,
  styles: `
    .page {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px;
    }
  `,
})
export class Confirmation {
  private readonly booking = inject(BookingStore);
  private readonly router = inject(Router);
  protected readonly email = this.booking.current()?.email ?? '';

  protected done(): void {
    this.booking.clear();
    void this.router.navigateByUrl('/');
  }
}
