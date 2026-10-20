import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { formatPrice, SelectionUnit, buildUnits } from '../../core/seat-utils';
import { Movie, Screening } from '../../core/models';

interface SummaryRow {
  unit: SelectionUnit;
  title: string;
  datetime: string;
  seatDescription: string;
  priceText: string;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class SummaryComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  readonly loaded = signal(false);
  readonly movie = signal<Movie | null>(null);
  readonly screening = signal<Screening | null>(null);

  readonly seats = computed(() => {
    const booking = this.bookingService.booking();
    return booking && booking.screeningId === this.screeningId ? booking.seats : [];
  });

  readonly rows = computed<SummaryRow[]>(() => {
    const movie = this.movie();
    const screening = this.screening();
    if (!movie || !screening) return [];
    return buildUnits(this.seats()).map((unit) => ({
      unit,
      title: movie.title,
      datetime: `${screening.date} ${screening.time}`,
      seatDescription: unit.isCouch ? `Couch ${unit.columnStart}-${unit.columnEnd}` : `${unit.columnStart}`,
      priceText: formatPrice(unit.price),
    }));
  });

  readonly total = computed(() => this.rows().reduce((sum, row) => sum + row.unit.price, 0));
  readonly totalText = computed(() => formatPrice(this.total()));

  constructor() {
    this.api.getScreening(this.screeningId).subscribe({
      next: (screening) => {
        this.api.getMovies().subscribe({
          next: (movies) => {
            const movie = movies.find((m) => m.id === screening.movieId);
            if (!movie) {
              this.router.navigate(['/']);
              return;
            }
            this.screening.set(screening);
            this.movie.set(movie);
            this.loaded.set(true);
          },
          error: () => this.router.navigate(['/']),
        });
      },
      error: () => this.router.navigate(['/']),
    });
  }

  remove(unit: SelectionUnit): void {
    const remaining = this.seats().filter((id) => !unit.ids.includes(id));
    this.bookingService.setSeats(remaining);
    if (remaining.length === 0) {
      this.router.navigate(['/screenings', this.screeningId, 'seats']);
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
