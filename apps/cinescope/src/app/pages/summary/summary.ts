import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { Movie, Screening, SeatItem } from '../../core/models';
import { formatPrice, isCouch, priceOf } from '../../core/seats';

@Component({
  selector: 'app-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly booking = inject(BookingService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);

  protected readonly rows = computed(() =>
    this.booking.items().map((item) => ({
      item,
      seat: isCouch(item) ? `Couch ${item.start}-${item.end}` : `${item.start}`,
      price: formatPrice(priceOf(item)),
    })),
  );
  protected readonly total = computed(() => formatPrice(this.booking.total()));

  constructor() {
    this.api
      .screening(this.id)
      .pipe(
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected remove(item: SeatItem): void {
    this.booking.removeItem(item);
    if (this.booking.items().length === 0) {
      this.router.navigate(['/screenings', this.id, 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.id, 'checkout']);
  }
}
