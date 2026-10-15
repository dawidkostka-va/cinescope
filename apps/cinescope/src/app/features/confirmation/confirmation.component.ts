import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../../core/booking.service';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationComponent {
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  protected readonly email = this.booking.booking()?.email ?? '';

  protected continue(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }
}
