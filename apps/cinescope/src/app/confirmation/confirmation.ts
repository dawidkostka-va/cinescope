import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking';

/** Payment successful. The route guard only opens this screen for a paid booking. */
@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  protected readonly email = this.booking.current()?.paidEmail ?? '';

  /** Clears the booking and returns to the movie list. */
  protected continueToMovies(): void {
    this.booking.clear();
    void this.router.navigateByUrl('/');
  }
}
