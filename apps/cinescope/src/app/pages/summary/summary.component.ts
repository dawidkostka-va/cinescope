import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, map } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { Movie, Screening } from '../../core/models';
import { formatPrice } from '../../shared/seat-utils';
import { SummaryItem, buildSummaryItems } from '../../shared/grouping';

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
  protected readonly bookingService = inject(BookingService);

  private readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly items = computed(() => buildSummaryItems(this.bookingService.booking()?.seats ?? []));
  protected readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  protected readonly formatPrice = formatPrice;

  constructor() {
    this.api
      .getScreening(this.screeningId)
      .pipe(switchMap((screening) => this.api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie })))))
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected remove(item: SummaryItem): void {
    this.bookingService.removeSeats(item.ids);
    if ((this.bookingService.booking()?.seats.length ?? 0) === 0) {
      this.router.navigate(['/screenings', this.screeningId, 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
