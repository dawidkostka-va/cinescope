import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly email = computed(() => this.booking.current()?.form.email ?? '');

  protected proceed(): void {
    this.booking.clear();
    this.router.navigate(['/']);
  }
}
