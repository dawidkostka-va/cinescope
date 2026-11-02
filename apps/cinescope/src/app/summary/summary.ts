import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { Api } from '../api';
import { BookingService } from '../booking';
import { Movie, Screening } from '../models';
import { formatPrice, itemsFromIds, SeatItem } from '../seat-utils';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private api = inject(Api);
  private router = inject(Router);
  private booking = inject(BookingService);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected screening = signal<Screening | null>(null);
  protected movie = signal<Movie | null>(null);
  protected formatPrice = formatPrice;

  protected items = computed(() => itemsFromIds(this.booking.booking()?.seats ?? []));
  protected total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0));

  constructor() {
    this.api
      .screening(this.id)
      .pipe(
        switchMap((screening) => forkJoin({ screening: [screening], movie: this.api.movie(screening.movieId) })),
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

  protected seatText(item: SeatItem): string {
    return item.couch ? `Couch ${item.start}-${item.end}` : `${item.start}`;
  }

  protected remove(item: SeatItem): void {
    const seats = (this.booking.booking()?.seats ?? []).filter((s) => !item.ids.includes(s));
    this.booking.setSeats(seats);
    if (seats.length === 0) this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.id, 'checkout']);
  }
}
