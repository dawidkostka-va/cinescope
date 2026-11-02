import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { catchError, EMPTY, map, Observable, switchMap, tap } from 'rxjs';
import { BookingService } from '../core/booking';
import { CinemaApi } from '../core/cinema-api';
import { showDate } from '../core/dates';
import { Movie, Screening } from '../core/models';
import { Toast } from '../core/toast';
import {
  auditoriumLayout,
  Cell,
  cellIds,
  cellKey,
  cellLabel,
  cellState,
  MAX_SEATS,
  RowLayout,
  SeatState,
  ticketsOf,
} from '../core/seats';

interface SeatMapView {
  screening: Screening;
  movie: Movie;
}

interface SelectedRow {
  row: number;
  labels: string[];
}

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(Toast);

  readonly id = input.required<string>();

  readonly layout: RowLayout[] = auditoriumLayout();
  readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  readonly view = toSignal<SeatMapView | null>(
    toObservable(this.id).pipe(switchMap((id) => this.load(Number(id)))),
    { initialValue: null },
  );

  readonly occupied = computed(() => new Set(this.view()?.screening.occupiedSeats ?? []));
  readonly selectedSeats = computed(() => this.booking.booking()?.seats ?? []);
  readonly selected = computed(() => new Set(this.selectedSeats()));
  readonly selectedRows = computed(() => groupByRow(this.selectedSeats()));

  readonly showDate = computed(() => {
    const screening = this.view()?.screening;
    return screening ? showDate(screening.date, screening.time) : '';
  });

  stateOf(cell: Cell): SeatState {
    return cellState(cell, this.occupied(), this.selected());
  }

  cellKey(cell: Cell): string {
    return cellKey(cell);
  }

  cancel(): void {
    this.booking.clear();
    this.router.navigate(['/']);
  }

  proceed(): void {
    if (this.selectedSeats().length > 0) {
      this.router.navigate(['/screenings', this.id(), 'summary']);
    }
  }

  toggle(cell: Cell): void {
    const state = this.stateOf(cell);
    if (state === 'unavailable') {
      return;
    }
    const seats = this.selectedSeats();
    const ids = cellIds(cell);
    if (state === 'selected') {
      this.booking.setSeats(seats.filter((id) => !ids.includes(id)));
    } else if (seats.length + ids.length > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
    } else {
      this.booking.setSeats([...seats, ...ids]);
    }
  }

  private load(id: number): Observable<SeatMapView> {
    return this.api.screening(id).pipe(
      switchMap((screening) =>
        this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
      ),
      tap(() => this.startBookingUnlessInProgress(id)),
      catchError(() => {
        this.router.navigate(['/']);
        return EMPTY;
      }),
    );
  }

  private startBookingUnlessInProgress(screeningId: number): void {
    const current = this.booking.booking();
    if (!current || current.screeningId !== screeningId || current.paidEmail !== null) {
      this.booking.start(screeningId);
    }
  }
}

function groupByRow(seats: string[]): SelectedRow[] {
  const rows: SelectedRow[] = [];
  for (const ticket of ticketsOf(seats)) {
    const last = rows.at(-1);
    if (last?.row === ticket.row) {
      last.labels.push(cellLabel(ticket));
    } else {
      rows.push({ row: ticket.row, labels: [cellLabel(ticket)] });
    }
  }
  return rows;
}
