import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { bookedItems, BookingService, formatPrice } from '../booking';
import { CinemaApi } from '../cinema-api';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class SummaryComponent {
  private readonly api = inject(CinemaApi);
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly formatPrice = formatPrice;

  protected readonly details = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) =>
        this.api.screeningWithMovie(Number(params.get('id'))).pipe(
          catchError(() => {
            this.router.navigateByUrl('/');
            return EMPTY;
          }),
        ),
      ),
    ),
  );

  protected readonly selection = signal<string[]>(this.bookings.get()?.selection ?? []);
  protected readonly items = computed(() => bookedItems(this.selection()));
  protected readonly totalLabel = computed(() => {
    const total = this.items().reduce((sum, item) => sum + item.price, 0);
    return `Total: ${formatPrice(total)}`;
  });

  protected remove(key: string, screeningId: number): void {
    const remaining = this.selection().filter((selected) => selected !== key);
    this.selection.set(remaining);
    const booking = this.bookings.get();
    if (booking) {
      this.bookings.save({ ...booking, selection: remaining });
    }
    if (remaining.length === 0) {
      this.router.navigate(['/screenings', screeningId, 'seats']);
    }
  }

  protected back(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }

  protected confirm(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'checkout']);
  }
}
