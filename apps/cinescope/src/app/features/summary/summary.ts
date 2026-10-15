import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { ScreeningData } from '../../core/models';
import { BookingItem, buildBookingItems, formatPrice, summarySeatLabel } from '../../core/seat.util';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly id = input.required<string>();

  private readonly dataSignal = signal<ScreeningData | null>(null);
  readonly data = this.dataSignal.asReadonly();

  readonly items = computed<BookingItem[]>(() => buildBookingItems(this.bookingService.booking()?.seats ?? []));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));
  readonly formatPrice = formatPrice;
  readonly seatLabel = summarySeatLabel;

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.api.getMovieAndScreening(Number(id)).pipe(
            catchError(() => {
              this.router.navigateByUrl('/');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((data) => this.dataSignal.set(data));
  }

  remove(item: BookingItem): void {
    this.bookingService.removeSeats(item.seatIds);
    if ((this.bookingService.booking()?.seats.length ?? 0) === 0) {
      this.router.navigate(['/screenings', this.id(), 'seats']);
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.id(), 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.id(), 'checkout']);
  }
}
