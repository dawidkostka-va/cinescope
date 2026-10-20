import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { Screening } from '../../models/screening.model';
import { ApiService } from '../../services/api.service';
import { BookingService } from '../../services/booking.service';
import { formatPrice } from '../../utils/seat.util';
import { groupIntoUnits, unitSeatLabel } from '../../utils/selection.util';

interface SummaryItem {
  ids: string[];
  row: number;
  seatLabel: string;
  priceLabel: string;
  price: number;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  private readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  private readonly screening = signal<Screening | null>(null);
  private readonly movie = signal<Movie | null>(null);

  readonly dateTime = computed(() => {
    const screening = this.screening();
    return screening ? `${screening.date} ${screening.time}` : '';
  });

  readonly movieTitle = computed(() => this.movie()?.title ?? '');

  readonly items = computed<SummaryItem[]>(() => {
    const units = groupIntoUnits(this.bookingService.booking()?.seats ?? []);
    return units.map((unit) => ({
      ids: unit.ids,
      row: unit.row,
      seatLabel: unitSeatLabel(unit),
      priceLabel: formatPrice(unit.price),
      price: unit.price,
    }));
  });

  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));
  readonly totalLabel = computed(() => `Total: ${this.total().toFixed(2)} PLN`);

  constructor() {
    this.api.getScreening(this.screeningId).subscribe({
      next: (screening) => {
        this.screening.set(screening);
        this.api.getMovie(screening.movieId).subscribe({
          next: (movie) => this.movie.set(movie),
          error: () => this.router.navigateByUrl('/'),
        });
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  remove(item: SummaryItem): void {
    this.bookingService.removeUnit(item.ids);
    if ((this.bookingService.booking()?.seats.length ?? 0) === 0) {
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
