import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingStore } from '../booking/booking.store';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Confirmation {
  private readonly booking = inject(BookingStore);
  private readonly router = inject(Router);

  readonly email = computed(() => this.booking.booking()?.paidEmail ?? '');

  continue(): void {
    this.booking.clear();
    void this.router.navigateByUrl('/');
  }
}
