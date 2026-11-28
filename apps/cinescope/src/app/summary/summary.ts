import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { TicketItem, formatPrice } from '../core/seating';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class SummaryComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);
  protected readonly items = this.booking.items;
  protected readonly total = computed(() => formatPrice(this.booking.total()));

  constructor() {
    this.api
      .screening(this.screeningId)
      .pipe(
        switchMap((screening) =>
          forkJoin({ screening: [screening], movie: this.api.movie(screening.movieId) }),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected price(item: TicketItem): string {
    return formatPrice(item.price);
  }

  protected seatText(item: TicketItem): string {
    return item.couch ? `Couch ${item.colStart}-${item.colEnd}` : `${item.colStart}`;
  }

  protected remove(item: TicketItem): void {
    this.booking.removeSeats(item.ids);
    if (this.booking.seatCount() === 0) this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
