import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { CinemaApi, Movie, Screening } from '../core/api';
import { BookingService } from '../core/booking';
import { formatPrice } from '../core/format';
import { Unit, groupIntoUnits } from '../core/seats';

interface SummaryItem {
  key: string;
  ids: string[];
  title: string;
  datetime: string;
  row: number;
  seat: string;
  price: string;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);

  private readonly screening = signal<Screening | null>(null);
  private readonly movie = signal<Movie | null>(null);

  private readonly id = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))), {
    requireSync: true,
  });

  private readonly units = computed(() => groupIntoUnits(this.bookingService.booking()?.seats ?? []));

  protected readonly items = computed<SummaryItem[]>(() => {
    const screening = this.screening();
    const movie = this.movie();
    if (!screening || !movie) {
      return [];
    }
    return this.units().map((unit) => ({
      key: unit.ids.join(','),
      ids: unit.ids,
      title: movie.title,
      datetime: `${screening.date} ${screening.time}`,
      row: unit.row,
      seat: describeSeat(unit),
      price: formatPrice(unit.price),
    }));
  });

  protected readonly totalLabel = computed(() => {
    const sum = this.units().reduce((total, unit) => total + unit.price, 0);
    return `Total: ${formatPrice(sum)}`;
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.api.screening(id).pipe(
            switchMap((screening) =>
              this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
            ),
            catchError(() => {
              void this.router.navigate(['/']);
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

  protected remove(item: SummaryItem): void {
    const booking = this.bookingService.booking();
    if (!booking) {
      return;
    }
    const seats = booking.seats.filter((seat) => !item.ids.includes(seat));
    this.bookingService.save({ ...booking, seats });
    if (seats.length === 0) {
      void this.router.navigate(['/screenings', this.id(), 'seats']);
    }
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.id(), 'seats']);
  }

  protected confirm(): void {
    void this.router.navigate(['/screenings', this.id(), 'checkout']);
  }
}

function describeSeat(unit: Unit): string {
  if (unit.isCouch) {
    return `Couch ${unit.columns[0]}-${unit.columns[1]}`;
  }
  return String(unit.columns[0]);
}
