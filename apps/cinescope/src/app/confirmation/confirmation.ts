import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Booking } from '../core/booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly booking = inject(Booking);
  private readonly router = inject(Router);

  protected readonly email = this.booking.current()?.email ?? '';

  protected done(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
