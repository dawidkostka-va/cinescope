import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { API_URL } from '../api';
import { BookingService } from '../booking.service';
import { Movie, Screening } from '../models';
import { bookedItems, formatPrice, SeatItem } from '../seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  readonly id = input.required<string>();

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);

  readonly items = computed(() => bookedItems(this.booking.booking()?.seats ?? []));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  readonly formatPrice = formatPrice;

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.http.get<Screening>(`${API_URL}/screenings/${id}`).pipe(
            switchMap((screening) =>
              this.http
                .get<Movie>(`${API_URL}/movies/${screening.movieId}`)
                .pipe(map((movie) => ({ screening, movie }))),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => this.router.navigate(['/']),
      });
  }

  remove(item: SeatItem): void {
    const seats = (this.booking.booking()?.seats ?? []).filter((id) => !item.ids.includes(id));
    this.booking.update({ seats });
    if (seats.length === 0) {
      this.router.navigate(['/screenings', this.id(), 'seats']);
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.id(), 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.id(), 'checkout']);
  }
}
