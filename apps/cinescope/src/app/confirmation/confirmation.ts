import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButton],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  protected readonly email = this.booking.paidEmail;

  protected continue(): void {
    this.booking.clear();
    void this.router.navigate(['/']);
  }
}
