import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, catchError, map, switchMap, tap } from 'rxjs';
import { BookingStore, isPaid } from '../booking';
import { CinemaApi, ScreeningWithMovie } from '../cinema-api.service';
import { EMPTY_CHECKOUT } from '../checkout/checkout-rules';
import { formatShowDate } from '../dates';
import { Toast } from '../toast';
import { CouchCell, SeatCell, SeatState, buildAuditorium, seatIdsOf } from './auditorium';

/** Painted state of a seat or couch: `selected` replaces a free state. */
export type DisplayState = SeatState | 'selected';

export interface SelectedRowLine {
  row: number;
  seats: string;
}

const MAX_SEATS = 10;

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(Toast);
  private readonly bookings = inject(BookingStore);

  /** Identifiers of the selected seats; a couch contributes both of its identifiers. */
  private readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  private readonly loaded = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) => this.load(id)),
    ),
    { initialValue: null },
  );

  /** Null while the screening is loading; a failed load redirects to `/`. */
  readonly page = computed(() => {
    const current = this.loaded();
    if (!current) {
      return null;
    }
    return {
      showDate: formatShowDate(current.screening.date, current.screening.time),
      rows: buildAuditorium(current.screening.occupiedSeats),
    };
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  /** One `Row <r>: <seats>` line per row with a selection, rows in ascending order. */
  readonly selectedRows = computed<SelectedRowLine[]>(() => {
    const lines: SelectedRowLine[] = [];
    for (const row of this.page()?.rows ?? []) {
      const seats = row.cells.flatMap((cell) => {
        if (cell.kind !== 'seat' && cell.kind !== 'couch') {
          return [];
        }
        if (!this.isSelected(cell)) {
          return [];
        }
        return [cell.kind === 'seat' ? `${cell.column}` : `${cell.columnStart}-${cell.columnEnd}`];
      });
      if (seats.length > 0) {
        lines.push({ row: row.row, seats: seats.join(', ') });
      }
    }
    return lines;
  });

  /** Selects or deselects a seat or couch as one unit; unavailable ones are ignored. */
  toggle(cell: SeatCell | CouchCell): void {
    if (cell.state === 'unavailable') {
      return;
    }
    const ids = seatIdsOf(cell);
    const selected = new Set(this.selectedIds());
    if (this.isSelected(cell)) {
      ids.forEach((id) => selected.delete(id));
    } else {
      if (selected.size + ids.length > MAX_SEATS) {
        this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
        return;
      }
      ids.forEach((id) => selected.add(id));
    }
    this.selectedIds.set(selected);
    this.persist(selected);
  }

  /** `Cancel` clears the booking and returns to the movie list. */
  cancel(): void {
    this.bookings.clear();
    void this.router.navigate(['/']);
  }

  /** `Continue` opens the summary; it does nothing without a selected seat. */
  openSummary(): void {
    const screening = this.loaded()?.screening;
    if (!screening || this.selectedCount() === 0) {
      return;
    }
    void this.router.navigate(['/screenings', screening.id, 'summary']);
  }

  isSelected(cell: SeatCell | CouchCell): boolean {
    return this.selectedIds().has(seatIdsOf(cell)[0]);
  }

  displayState(cell: SeatCell | CouchCell): DisplayState {
    if (cell.state === 'unavailable') {
      return 'unavailable';
    }
    return this.isSelected(cell) ? 'selected' : cell.state;
  }

  private load(id: string): Observable<ScreeningWithMovie> {
    return this.api.screeningWithMovie(id).pipe(
      tap(({ screening }) => this.openBooking(screening.id)),
      catchError(() => {
        void this.router.navigate(['/']);
        return EMPTY;
      }),
    );
  }

  /**
   * Shows the booking in progress when it belongs to this screening and is not paid. Otherwise
   * (no booking, another screening, or a paid booking) a new, empty booking replaces it.
   */
  private openBooking(screeningId: number): void {
    const existing = this.bookings.read();
    if (existing?.screeningId === screeningId && !isPaid(existing)) {
      this.selectedIds.set(new Set(existing.seats));
      return;
    }
    this.bookings.write({ screeningId, seats: [], checkout: EMPTY_CHECKOUT });
    this.selectedIds.set(new Set());
  }

  /** Stores the selection in the booking, keeping the rest of it (the checkout values). */
  private persist(selected: ReadonlySet<string>): void {
    const booking = this.bookings.read();
    if (booking) {
      this.bookings.write({ ...booking, seats: [...selected] });
    }
  }
}
