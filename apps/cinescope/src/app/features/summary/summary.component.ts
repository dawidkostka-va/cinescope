import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { BookingService } from '../../core/services/booking.service';
import { Movie } from '../../core/models/movie.model';
import { Screening } from '../../core/models/screening.model';
import { SummaryEntry, buildSummaryEntries, formatPrice } from '../../core/utils/seat.util';

interface SummaryRowVm extends SummaryEntry {
  movieTitle: string;
  datetime: string;
  priceText: string;
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
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);

  private readonly screeningId = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))), {
    initialValue: NaN,
  });

  private readonly screening = signal<Screening | null>(null);
  private readonly movie = signal<Movie | null>(null);

  readonly entries = computed<SummaryRowVm[]>(() => {
    const screening = this.screening();
    const movie = this.movie();
    const booking = this.bookingService.booking();
    if (!screening || !movie || !booking) return [];
    return buildSummaryEntries(booking.seats).map((entry) => ({
      ...entry,
      movieTitle: movie.title,
      datetime: `${screening.date} ${screening.time}`,
      priceText: formatPrice(entry.price),
    }));
  });

  readonly total = computed(() => this.entries().reduce((sum, entry) => sum + entry.price, 0));
  readonly totalText = computed(() => `Total: ${formatPrice(this.total())}`);

  constructor() {
    effect(() => {
      const id = this.screeningId();
      this.screening.set(null);
      this.movie.set(null);

      if (!Number.isFinite(id)) {
        this.router.navigateByUrl('/');
        return;
      }

      this.api.getScreening(id).subscribe({
        next: (screening) => {
          this.api.getMovie(screening.movieId).subscribe({
            next: (movie) => {
              this.screening.set(screening);
              this.movie.set(movie);
            },
            error: () => this.router.navigateByUrl('/'),
          });
        },
        error: () => this.router.navigateByUrl('/'),
      });
    });
  }

  remove(entry: SummaryRowVm): void {
    this.bookingService.removeSeats(entry.identifiers);
    if ((this.bookingService.booking()?.seats.length ?? 0) === 0) {
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
