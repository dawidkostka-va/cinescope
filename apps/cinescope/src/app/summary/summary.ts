import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import {
  compareKeys,
  describeSeat,
  parseKey,
  pln,
  priceOf,
  totalPrice,
} from '../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  protected readonly pln = pln;
  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);

  protected readonly items = computed(() =>
    [...(this.booking.booking()?.items ?? [])].sort(compareKeys).map((key) => ({
      key,
      row: parseKey(key).row,
      seat: describeSeat(key),
      price: priceOf(key),
    })),
  );

  protected readonly total = computed(() => totalPrice(this.items().map((i) => i.key)));

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        switchMap((params) =>
          this.api.loadScreening(params.get('id') ?? '').pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (result) this.data.set(result);
        else this.router.navigateByUrl('/');
      });
  }

  protected remove(key: string): void {
    const remaining = this.items()
      .map((i) => i.key)
      .filter((k) => k !== key);
    this.booking.setItems(remaining);
    if (remaining.length === 0) this.toSeats();
  }

  protected toSeats(): void {
    this.router.navigate(['/screenings', this.booking.booking()?.screeningId, 'seats']);
  }

  protected toCheckout(): void {
    this.router.navigate(['/screenings', this.booking.booking()?.screeningId, 'checkout']);
  }
}
