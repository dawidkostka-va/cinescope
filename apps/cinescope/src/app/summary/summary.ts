import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { SummaryItem, buildSummaryItems, formatPrice } from '../core/auditorium';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly items = computed<SummaryItem[]>(() => {
    const booking = this.bookingService.booking();
    return booking ? buildSummaryItems(booking.seats) : [];
  });

  protected readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  protected readonly datetime = computed(() => {
    const screening = this.screening();
    return screening ? `${screening.date} ${screening.time}` : '';
  });

  protected readonly formatPrice = formatPrice;

  constructor() {
    effect(() => {
      const id = this.screeningId();
      this.load(id);
    });
  }

  private load(id: number): void {
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
  }

  protected remove(item: SummaryItem): void {
    const booking = this.bookingService.booking();
    if (!booking) {
      return;
    }
    const remaining = booking.seats.filter((id) => !item.seatIds.includes(id));
    this.bookingService.setSeats(remaining);
    if (remaining.length === 0) {
      this.router.navigate(['/screenings', this.screeningId(), 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'checkout']);
  }
}
