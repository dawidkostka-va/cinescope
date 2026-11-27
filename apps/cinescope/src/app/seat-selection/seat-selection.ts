import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, catchError, map, switchMap, tap } from 'rxjs';
import { API_URL } from '../api';
import { BookingService } from '../booking';
import { formatShowDate } from '../dates';
import { Movie, Screening } from '../models';
import { ToastService } from '../toast';
import { buildAuditorium, CouchCell, SeatCell, seatIdsOf } from './auditorium';

/** A booking holds at most this many seats; a couch counts as 2. */
export const MAX_SEATS_PER_BOOKING = 10;
const MAX_SEATS_MESSAGE = `Maximum ${MAX_SEATS_PER_BOOKING} seats per booking`;

const LEGEND = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
] as const;

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);

  protected readonly screening = signal<Screening | null>(null);
  /** Seat identifiers (`R<row>C<column>`) of the current selection. */
  private readonly selectedSeats = signal<ReadonlySet<string>>(new Set());

  protected readonly legend = LEGEND;
  protected readonly selectedCount = computed(() => this.selectedSeats().size);

  protected readonly showDate = computed(() => {
    const screening = this.screening();
    return screening ? formatShowDate(screening.date, screening.time) : '';
  });

  protected readonly rows = computed(() =>
    buildAuditorium(this.screening()?.occupiedSeats ?? [], this.selectedSeats()),
  );

  /** One line per row with a selection, in ascending row and column order. */
  protected readonly selectedRows = computed(() =>
    this.rows()
      .map(({ row, cells }) => ({
        row,
        seats: cells.flatMap((cell) => {
          if (cell.kind === 'seat' && cell.state === 'selected') {
            return [String(cell.column)];
          }
          if (cell.kind === 'couch' && cell.state === 'selected') {
            return [`${cell.columnStart}-${cell.columnEnd}`];
          }
          return [];
        }),
      }))
      .filter((line) => line.seats.length > 0),
  );

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        tap(() => this.screening.set(null)),
        switchMap((id) =>
          this.loadScreening(id).pipe(
            catchError(() => {
              void this.router.navigateByUrl('/');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((screening) => {
        this.screening.set(screening);
        this.selectedSeats.set(this.openBooking(screening.id));
      });
  }

  /** Selects or deselects a seat or couch; a couch is always toggled as one unit. */
  protected toggle(cell: SeatCell | CouchCell): void {
    if (cell.state === 'unavailable') {
      return;
    }

    const ids = seatIdsOf(cell);
    const selected = new Set(this.selectedSeats());

    if (cell.state === 'selected') {
      ids.forEach((id) => selected.delete(id));
    } else if (selected.size + ids.length > MAX_SEATS_PER_BOOKING) {
      this.toast.show(MAX_SEATS_MESSAGE);
      return;
    } else {
      ids.forEach((id) => selected.add(id));
    }
    this.selectedSeats.set(selected);
    this.saveSelection(selected);
  }

  protected cancel(): void {
    this.booking.clear();
    this.selectedSeats.set(new Set());
    void this.router.navigateByUrl('/');
  }

  protected continueToSummary(): void {
    const id = this.screening()?.id;
    if (id === undefined || this.selectedCount() === 0) {
      return;
    }
    void this.router.navigate(['/screenings', id, 'summary']);
  }

  /**
   * Returns the seats of the booking in progress when it belongs to this screening. Otherwise
   * starts a new, empty booking for the screening, replacing the previous one.
   */
  private openBooking(screeningId: number): ReadonlySet<string> {
    const current = this.booking.current();
    if (current?.screeningId === screeningId && current.paidEmail === undefined) {
      return new Set(current.seats);
    }
    this.booking.save({ screeningId, seats: [] });
    return new Set();
  }

  /** Stores the new selection; the checkout values of the booking are kept. */
  private saveSelection(selected: ReadonlySet<string>): void {
    const current = this.booking.current();
    if (current) {
      this.booking.save({ ...current, seats: [...selected] });
    }
  }

  /** Loads the screening and its movie; the page only needs the screening, but both must load. */
  private loadScreening(id: string): Observable<Screening> {
    return this.http.get<Screening>(`${API_URL}/screenings/${id}`).pipe(
      switchMap((screening) =>
        this.http.get<Movie>(`${API_URL}/movies/${screening.movieId}`).pipe(map(() => screening)),
      ),
    );
  }
}
