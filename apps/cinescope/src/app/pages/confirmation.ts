import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingStore } from '../core/booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButton],
  template: `
    <main class="page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ email }}</p>
      <button matButton="filled" data-testid="confirmation-continue-button" (click)="done()">Continue</button>
    </main>
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
  private readonly store = inject(BookingStore);
  private readonly router = inject(Router);
  protected email = this.store.booking()?.paidEmail ?? '';

  protected done(): void {
    this.store.clear();
    this.router.navigateByUrl('/');
  }
}
