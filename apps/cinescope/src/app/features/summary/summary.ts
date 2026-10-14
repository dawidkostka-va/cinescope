import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie, Screening } from '../../core/models/api.model';
import { BookingItem, formatPrice, toBookingItems, totalPrice } from '../../core/models/seat.model';
import { BookingService } from '../../core/services/booking.service';
import { MoviesApiService } from '../../core/services/movies-api.service';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly moviesApi = inject(MoviesApiService);
  private readonly bookingService = inject(BookingService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly items = computed<BookingItem[]>(() => toBookingItems(this.bookingService.seats()));
  protected readonly total = computed(() => formatPrice(totalPrice(this.items())));

  constructor() {
    effect(() => this.load(this.screeningId()));
  }

  protected formatPrice = formatPrice;

  protected dateTime(): string {
    const screening = this.screening();
    return screening ? `${screening.date} ${screening.time}` : '';
  }

  protected seatDescription(item: BookingItem): string {
    return item.isCouch ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`;
  }

  protected remove(item: BookingItem): void {
    this.bookingService.deselect(item.ids);
    if (this.bookingService.seats().length === 0) {
      this.router.navigate(['/screenings', this.screeningId(), 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'checkout']);
  }

  private load(id: number): void {
    this.moviesApi.getScreening(id).subscribe({
      next: (screening) => {
        this.moviesApi.getMovie(screening.movieId).subscribe({
          next: (movie) => {
            this.screening.set(screening);
            this.movie.set(movie);
          },
          error: () => this.redirectHome(),
        });
      },
      error: () => this.redirectHome(),
    });
  }

  private redirectHome(): void {
    this.router.navigate(['/']);
  }
}
