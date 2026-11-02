import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, map, switchMap } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService } from '../booking/booking.service';
import { Movie, Screening } from '../models';
import { formatPln, priceOf } from '../pricing';
import { Cell, cellKey, compareCells } from '../seat-map/auditorium';

interface TicketItem {
  cell: Cell;
  movieTitle: string;
  dateTime: string;
  row: number;
  seat: string;
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);

  private readonly details = toSignal(
    this.route.paramMap.pipe(
      map((params) => Number(params.get('id'))),
      switchMap((id) =>
        this.api.getScreeningDetails(id).pipe(
          catchError(() => {
            void this.router.navigate(['/']);
            return EMPTY;
          }),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected readonly items = computed<TicketItem[]>(() => {
    const details = this.details();
    if (!details) return [];
    return this.booking
      .cells()
      .slice()
      .sort(compareCells)
      .map((cell) => toItem(cell, details.movie, details.screening));
  });

  protected readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  protected readonly formatPln = formatPln;

  protected remove(cell: Cell): void {
    const remaining = this.booking.cells().filter((c) => cellKey(c) !== cellKey(cell));
    this.booking.setCells(remaining);
    if (remaining.length === 0) {
      void this.router.navigate(['/screenings', this.details()?.screening.id, 'seats']);
    }
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.details()?.screening.id, 'seats']);
  }

  protected confirm(): void {
    void this.router.navigate(['/screenings', this.details()?.screening.id, 'checkout']);
  }
}

function toItem(cell: Cell, movie: Movie, screening: Screening): TicketItem {
  return {
    cell,
    movieTitle: movie.title,
    dateTime: `${screening.date} ${screening.time}`,
    row: cell.row,
    seat: cell.kind === 'seat' ? String(cell.column) : `Couch ${cell.start}-${cell.end}`,
    price: priceOf(cell),
  };
}
