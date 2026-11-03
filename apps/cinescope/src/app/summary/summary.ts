import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { CinemaApi } from '../api';
import { BookingService } from '../booking/booking';
import { formatShowDate } from '../dates';
import { formatPrice, priceOf, totalPriceOf } from '../booking/pricing';
import { bookedCells, Cell } from '../seat-selection/auditorium';
import { Movie, Screening } from '../models';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  readonly id = input.required<string>();

  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly bookings = inject(BookingService);

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly seats = signal<string[]>(this.bookings.current()?.seats ?? []);

  readonly showDate = computed(() => {
    const screening = this.screening();
    return screening ? formatShowDate(screening.date, screening.time) : '';
  });

  readonly items = computed(() =>
    bookedCells(this.seats()).map((cell) => ({
      key: cell.ids.join(','),
      cell,
      seat: cell.kind === 'couch' ? `Couch ${cell.start}-${cell.end}` : `${cell.start}`,
      price: formatPrice(priceOf(cell)),
    })),
  );

  readonly total = computed(() => `Total: ${formatPrice(totalPriceOf(this.seats()))}`);

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.api.screeningWithMovie(Number(id)).pipe(
            catchError(() => {
              this.router.navigate(['/']);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ screening, movie }) => {
        this.screening.set(screening);
        this.movie.set(movie);
      });
  }

  remove(cell: Cell): void {
    const booking = this.bookings.current();
    if (!booking) {
      return;
    }
    const seats = booking.seats.filter((id) => !cell.ids.includes(id));
    this.bookings.save({ ...booking, seats });
    this.seats.set(seats);
    if (seats.length === 0) {
      this.router.navigate(['/screenings', booking.screeningId, 'seats']);
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.id(), 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.id(), 'checkout']);
  }
}
