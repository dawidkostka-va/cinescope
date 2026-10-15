import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { BookingService } from '../../core/booking.service';
import { ScreeningData } from '../../core/screening-resolver';
import { BookingItem, formatPrice, groupBookingSeats } from '../../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  private readonly routeData = toSignal(this.route.data, { requireSync: true }) as () => Data;
  protected readonly screening = computed(() => (this.routeData()['data'] as ScreeningData).screening);
  protected readonly movie = computed(() => (this.routeData()['data'] as ScreeningData).movie);
  protected readonly dateTime = computed(() => `${this.screening().date} ${this.screening().time}`);

  protected readonly items = computed(() => groupBookingSeats(this.booking.booking()?.seats ?? []));
  protected readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  protected seatDescription(item: BookingItem): string {
    return item.kind === 'couch' ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.column}`;
  }

  protected price(amount: number): string {
    return formatPrice(amount);
  }

  protected remove(item: BookingItem): void {
    this.booking.removeSeats(item.ids);
    if (this.booking.seatCount() === 0) {
      this.router.navigate(['/screenings', this.screening().id, 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screening().id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.screening().id, 'checkout']);
  }
}
