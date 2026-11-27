import { Component, computed, effect, inject, resource, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { BookedSeat, BookingService, isSameSeat } from '../booking';
import { CinescopeApi } from '../cinescope-api';
import { formatShowDate } from '../dates';
import { ToastService } from '../toast';
import { SeatCell, SeatState, buildAuditorium, seatId } from './auditorium';

/** A booking holds at most this many seats; a couch counts as two. */
const MAX_SEATS = 10;

/** The state a seat is drawn with: its own state, or `selected` while it is part of the selection. */
type DisplayState = SeatState | 'selected';

const LEGEND: readonly { state: DisplayState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-selection',
  imports: [MatButton],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(CinescopeApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly bookings = inject(BookingService);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  /** Loads the screening and its movie once when the screen opens. */
  protected readonly details = resource({
    params: () => Number(this.params().get('id')),
    loader: ({ params: id }) => {
      if (!Number.isInteger(id) || id < 1) {
        return Promise.reject(new Error(`Invalid screening id: ${id}`));
      }
      return this.api.loadScreening(id);
    },
  });

  /** The loaded screening, or null while loading or after a failed load (`value()` would throw). */
  protected readonly loaded = computed(() => (this.details.hasValue() ? this.details.value() : null));

  protected readonly showDate = computed(() => {
    const data = this.loaded();
    return data ? formatShowDate(data.screening.date, data.screening.time) : '';
  });

  protected readonly rows = computed(() => {
    const data = this.loaded();
    return data ? buildAuditorium(data.screening.occupiedSeats) : [];
  });

  protected readonly legend = LEGEND;

  /** Seats and couches of the booking in progress, in the order they were picked. */
  private readonly selection = signal<BookedSeat[]>([]);

  private readonly selectedIds = computed(() => new Set(this.selection().map((seat) => seatId(seat.row, seat.column))));

  /** Number of seats selected; a couch counts as two. */
  protected readonly selectedSeatCount = computed(() =>
    this.selection().reduce((count, cell) => count + seatsIn(cell), 0),
  );

  /** One line per row with a selection, rows ascending, seats ascending within a row. */
  protected readonly selectedRows = computed(() => {
    const sorted = [...this.selection()].sort((a, b) => a.row - b.row || a.column - b.column);
    const labelsByRow = new Map<number, string[]>();
    for (const cell of sorted) {
      const label = cell.kind === 'couch' ? `${cell.column}-${cell.columnEnd}` : `${cell.column}`;
      labelsByRow.set(cell.row, [...(labelsByRow.get(cell.row) ?? []), label]);
    }
    return [...labelsByRow].map(([row, labels]) => ({ row, seats: labels.join(', ') }));
  });

  constructor() {
    // A screening that cannot be loaded (404 or any other failure) sends the customer back to the movie list.
    effect(() => {
      if (this.details.status() === 'error') {
        void this.router.navigate(['/']);
      }
    });

    // Once the screening has loaded, show the booking in progress when it belongs to this screening;
    // otherwise start a new, empty booking for it.
    effect(() => {
      const data = this.loaded();
      if (data) {
        untracked(() => this.selection.set(this.bookings.openFor(data.screening.id).seats));
      }
    });
  }

  /** The state to draw a seat or couch with. */
  protected displayState(cell: SeatCell): DisplayState {
    return this.selectedIds().has(seatId(cell.row, cell.column)) ? 'selected' : cell.state;
  }

  /** Selects or deselects a seat or couch. Unavailable seats do nothing; a click over the limit is ignored with a toast. */
  protected toggle(cell: SeatCell): void {
    const data = this.loaded();
    if (!data || cell.state === 'unavailable') {
      return;
    }

    const current = this.selection();
    const picked: BookedSeat = { kind: cell.kind, row: cell.row, column: cell.column, columnEnd: cell.columnEnd };
    if (this.selectedIds().has(seatId(cell.row, cell.column))) {
      this.saveSelection(data.screening.id, current.filter((seat) => !isSameSeat(seat, picked)));
      return;
    }

    if (this.selectedSeatCount() + seatsIn(picked) > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    }
    this.saveSelection(data.screening.id, [...current, picked]);
  }

  /** Cancel clears the booking and returns to the movie list. */
  protected cancel(): void {
    this.bookings.clear();
    this.selection.set([]);
    void this.router.navigate(['/']);
  }

  /** Continue opens the summary; it does nothing without a selected seat. */
  protected continue(): void {
    const data = this.loaded();
    if (data && this.selection().length > 0) {
      void this.router.navigate(['/screenings', data.screening.id, 'summary']);
    }
  }

  /** Updates the selection and keeps the booking in `sessionStorage` in step with it. */
  private saveSelection(screeningId: number, seats: BookedSeat[]): void {
    this.selection.set(seats);
    this.bookings.saveSeats(screeningId, seats);
  }
}

function seatsIn(seat: BookedSeat): number {
  return seat.columnEnd - seat.column + 1;
}
