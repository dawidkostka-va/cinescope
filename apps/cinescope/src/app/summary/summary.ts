import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { catchError, EMPTY, map, Observable, switchMap } from 'rxjs';
import { BookingService } from '../core/booking';
import { CinemaApi } from '../core/cinema-api';
import { Movie, Screening } from '../core/models';
import {
  Cell,
  cellIds,
  cellKey,
  cellLabel,
  cellPrice,
  formatPln,
  ticketsOf,
  totalOf,
} from '../core/seats';

interface SummaryView {
  screening: Screening;
  movie: Movie;
}

interface SummaryItem {
  key: string;
  cell: Cell;
  seat: string;
  price: string;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  readonly id = input.required<string>();

  readonly view = toSignal<SummaryView | null>(
    toObservable(this.id).pipe(switchMap((id) => this.load(Number(id)))),
    { initialValue: null },
  );

  readonly items = computed<SummaryItem[]>(() =>
    ticketsOf(this.booking.booking()?.seats ?? []).map((cell) => ({
      key: cellKey(cell),
      cell,
      seat: cell.kind === 'seat' ? cellLabel(cell) : `Couch ${cellLabel(cell)}`,
      price: formatPln(cellPrice(cell)),
    })),
  );

  readonly total = computed(
    () => `Total: ${formatPln(totalOf(this.booking.booking()?.seats ?? []))}`,
  );

  remove(cell: Cell): void {
    const ids = cellIds(cell);
    const seats = (this.booking.booking()?.seats ?? []).filter((id) => !ids.includes(id));
    this.booking.setSeats(seats);
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

  private load(id: number): Observable<SummaryView> {
    return this.api.screening(id).pipe(
      switchMap((screening) =>
        this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
      ),
      catchError(() => {
        this.router.navigate(['/']);
        return EMPTY;
      }),
    );
  }
}
