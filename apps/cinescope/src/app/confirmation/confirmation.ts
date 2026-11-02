import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking/booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButton],
  template: `
    <div class="page">
      <h1 data-testid="confirmation-heading">Payment successful</h1>
      <p data-testid="confirmation-message">Your tickets will be sent shortly to {{ email() }}</p>
      <button
        mat-flat-button
        color="primary"
        data-testid="confirmation-continue-button"
        (click)="continueToMovies()"
      >
        Continue
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      font-family: Roboto, 'Helvetica Neue', sans-serif;
    }

    .page {
      max-width: 520px;
      margin: 48px auto 0;
      text-align: center;
    }

    h1 {
      margin: 0 0 12px;
      font-size: 28px;
    }

    p {
      margin: 0 0 24px;
    }
  `,
})
export class Confirmation {
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly email = computed(() => this.booking.booking()?.paidEmail ?? '');

  protected continueToMovies(): void {
    this.booking.clear();
    void this.router.navigate(['/']);
  }
}
