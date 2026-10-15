import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { MoviesService } from '../../core/services/movies.service';
import { Movie } from '../../core/models/movie.model';
import { Screening } from '../../core/models/screening.model';
import { SeatGroup, groupSeats } from '../../shared/seat-grouping';
import { formatPrice } from '../../shared/seat-pricing';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly moviesService = inject(MoviesService);
  private readonly bookingService = inject(BookingService);

  protected readonly formatPrice = formatPrice;

  private readonly screeningId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: NaN },
  );

  readonly booking = this.bookingService.booking;
  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly loaded = signal(false);

  readonly items = computed<SeatGroup[]>(() => groupSeats(this.booking()?.seats ?? []));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  constructor() {
    effect(() => {
      const id = this.screeningId();
      if (Number.isNaN(id)) {
        this.router.navigateByUrl('/');
        return;
      }
      this.load(id);
    });
  }

  private load(id: number): void {
    this.moviesService.getScreening(id).subscribe({
      next: (screening) => {
        this.moviesService.getMovie(screening.movieId).subscribe({
          next: (movie) => {
            this.screening.set(screening);
            this.movie.set(movie);
            this.loaded.set(true);
          },
          error: () => this.router.navigateByUrl('/'),
        });
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  dateTime(): string {
    const screening = this.screening();
    return screening ? `${screening.date} ${screening.time}` : '';
  }

  seatLabel(item: SeatGroup): string {
    return item.kind === 'couch' ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.column}`;
  }

  remove(item: SeatGroup): void {
    this.bookingService.removeSeats(item.ids);
    const remaining = this.bookingService.booking()?.seats.length ?? 0;
    if (remaining === 0) {
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
