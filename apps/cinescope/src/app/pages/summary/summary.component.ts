import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { BookingService } from '../../core/booking.service';
import { Movie, Screening } from '../../core/models';
import { MoviesService } from '../../core/movies.service';
import { ScreeningsService } from '../../core/screenings.service';
import { groupSelection, SelectionItem } from '../../core/selection.util';
import { formatPrice } from '../../core/seat-map.util';

interface SummaryRow {
  item: SelectionItem;
  seatLabel: string;
  priceLabel: string;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly screeningsService = inject(ScreeningsService);
  private readonly moviesService = inject(MoviesService);
  private readonly bookingService = inject(BookingService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  private readonly screening = signal<Screening | null>(null);
  private readonly movie = signal<Movie | null>(null);
  readonly loaded = computed(() => this.screening() !== null && this.movie() !== null);

  readonly dateTime = computed(() => {
    const screening = this.screening();
    return screening ? `${screening.date} ${screening.time}` : '';
  });

  readonly rows = computed<SummaryRow[]>(() => {
    const items = groupSelection(this.bookingService.booking().seats);
    return items.map((item) => ({
      item,
      seatLabel: item.isCouch ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`,
      priceLabel: formatPrice(item.price),
    }));
  });

  readonly total = computed(() => this.rows().reduce((sum, row) => sum + row.item.price, 0));
  readonly totalLabel = computed(() => formatPrice(this.total()));

  constructor() {
    effect(() => {
      this.loadScreening(this.screeningId());
    });
  }

  private loadScreening(id: number): void {
    this.screening.set(null);
    this.movie.set(null);

    if (!Number.isFinite(id)) {
      this.router.navigateByUrl('/');
      return;
    }

    this.screeningsService
      .getById(id)
      .pipe(switchMap((screening) => this.moviesService.getById(screening.movieId).pipe(map((movie) => ({ screening, movie })))))
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  movieTitle(): string {
    return this.movie()?.title ?? '';
  }

  remove(item: SelectionItem): void {
    this.bookingService.removeSeats(item.ids);
    if (this.bookingService.booking().seats.length === 0) {
      this.router.navigate(['/screenings', this.screeningId(), 'seats']);
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'checkout']);
  }
}
