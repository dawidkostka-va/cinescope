import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
})
export class Confirmation {
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly email = this.booking.booking()?.email ?? '';

  protected proceed(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
