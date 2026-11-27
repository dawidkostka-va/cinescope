import { Component, computed, effect, inject, linkedSignal, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService } from '../booking';
import { formatShowDate, parseIsoDate } from '../dates';
import { Movie, Screening } from '../models';
import { ToastService } from '../toast/toast';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface SeatView {
  column: number;
  /** Seat identifiers the seat occupies: one. */
  ids: string[];
  state: SeatState;
  gridColumn: string;
}

interface CouchView {
  start: number;
  end: number;
  /** Seat identifiers the couch occupies: two. */
  ids: string[];
  state: SeatState;
  gridColumn: string;
}

interface AisleView {
  gridColumn: string;
}

interface RowView {
  number: number;
  seats: SeatView[];
  couches: CouchView[];
  aisles: AisleView[];
}

interface SelectionLine {
  row: number;
  /** Seats of the row in column order, e.g. "11, 12" or "1-2". */
  seats: string;
}

interface LegendItem {
  state: SeatState;
  label: string;
}

const ROW_COUNT = 15;
const COLUMN_COUNT = 24;
const COUCH_ROW = 15;
/** Rows 1 to this number have no seats in columns 1–4 (the entrance). */
const ENTRANCE_LAST_ROW = 10;
/** Aisles sit after these columns; each is two grid tracks wide. */
const AISLE_AFTER_COLUMNS = [4, 20];
/** Grid tracks of the row labels; the seat columns occupy the tracks in between. */
const LEFT_LABEL_TRACK = 1;
const RIGHT_LABEL_TRACK = 30;
/** A booking holds at most this many seats; a couch counts as two. */
const MAX_SEATS = 10;

const LEGEND: LegendItem[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

/**
 * Grid track of a seat column. Track 1 is the left row label, tracks 2–29 hold the seat
 * columns with each aisle taking two tracks, track 30 is the right row label.
 */
function gridTrack(column: number): number {
  return 1 + column + (column > 4 ? 2 : 0) + (column > 20 ? 2 : 0);
}

function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

/**
 * State of a seat or couch made of `ids`. Unavailable wins over selected; a couch is
 * selected only when both of its seats are, so it is never half-selected.
 */
function stateOf(
  ids: readonly string[],
  accessible: boolean,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  if (ids.some((id) => occupied.has(id))) {
    return 'unavailable';
  }
  if (ids.every((id) => selected.has(id))) {
    return 'selected';
  }
  return accessible ? 'accessible' : 'available';
}

function buildRows(occupied: ReadonlySet<string>, selected: ReadonlySet<string>): RowView[] {
  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const number = index + 1;
    const seats: SeatView[] = [];
    const couches: CouchView[] = [];

    if (number === COUCH_ROW) {
      for (let start = 1; start < COLUMN_COUNT; start += 2) {
        const end = start + 1;
        const ids = [seatId(number, start), seatId(number, end)];
        couches.push({
          start,
          end,
          ids,
          state: stateOf(ids, false, occupied, selected),
          gridColumn: `${gridTrack(start)} / span 2`,
        });
      }
    } else {
      const firstColumn = number <= ENTRANCE_LAST_ROW ? 5 : 1;
      for (let column = firstColumn; column <= COLUMN_COUNT; column++) {
        const ids = [seatId(number, column)];
        seats.push({
          column,
          ids,
          state: stateOf(ids, isAccessible(number, column), occupied, selected),
          gridColumn: String(gridTrack(column)),
        });
      }
    }

    const aisles = AISLE_AFTER_COLUMNS.map((column) => ({
      gridColumn: `${gridTrack(column) + 1} / span 2`,
    }));

    return { number, seats, couches, aisles };
  });
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(ToastService);
  private readonly bookings = inject(BookingService);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  /** The screening id from the URL; undefined keeps the resource idle. */
  private readonly screeningId = computed(() => this.params().get('id') ?? undefined);

  readonly data = resource({
    params: () => this.screeningId(),
    loader: async ({ params: id }): Promise<{ screening: Screening; movie: Movie }> => {
      const screening = await firstValueFrom(this.api.getScreening(id));
      const movie = await firstValueFrom(this.api.getMovie(screening.movieId));
      this.bookings.openFor(screening.id);
      return { screening, movie };
    },
  });

  readonly screening = computed(() => (this.data.hasValue() ? this.data.value().screening : null));

  readonly showDate = computed(() => {
    const screening = this.screening();
    const date = screening ? parseIsoDate(screening.date) : null;
    return screening && date ? formatShowDate(date, screening.time) : '';
  });

  private readonly occupied = computed<ReadonlySet<string>>(
    () => new Set(this.screening()?.occupiedSeats ?? []),
  );

  /** Identifiers of the selected seats; a couch contributes both of its identifiers. Starts from the booking in progress. */
  readonly selectedIds = linkedSignal<string | undefined, ReadonlySet<string>>({
    source: this.screeningId,
    computation: (id) => new Set(this.bookings.seatsFor(id)),
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly rows = computed<RowView[]>(() =>
    this.screening() ? buildRows(this.occupied(), this.selectedIds()) : [],
  );

  /** The selected-seats panel: one line per row with a selection, in row order. */
  readonly selectionLines = computed<SelectionLine[]>(() =>
    this.rows()
      .map((row) => {
        const picked = [
          ...row.seats
            .filter((seat) => seat.state === 'selected')
            .map((seat) => ({ column: seat.column, label: String(seat.column) })),
          ...row.couches
            .filter((couch) => couch.state === 'selected')
            .map((couch) => ({ column: couch.start, label: `${couch.start}-${couch.end}` })),
        ].sort((a, b) => a.column - b.column);
        return { row: row.number, seats: picked.map((item) => item.label).join(', ') };
      })
      .filter((line) => line.seats !== ''),
  );

  readonly legend = LEGEND;
  readonly leftLabelColumn = String(LEFT_LABEL_TRACK);
  readonly rightLabelColumn = String(RIGHT_LABEL_TRACK);

  constructor() {
    effect(() => {
      if (this.data.status() === 'error') {
        void this.router.navigate(['/']);
      }
    });
  }

  /**
   * Selects or deselects the seat or couch made of `ids`. Unavailable seats are ignored; a
   * selection that would exceed the cap is ignored and shows a toast. Deselecting is always allowed.
   */
  toggle(ids: readonly string[]): void {
    const screening = this.screening();
    const occupied = this.occupied();
    if (!screening || ids.some((id) => occupied.has(id))) {
      return;
    }

    const selected = new Set(this.selectedIds());
    if (ids.every((id) => selected.has(id))) {
      ids.forEach((id) => selected.delete(id));
    } else {
      const added = ids.filter((id) => !selected.has(id)).length;
      if (selected.size + added > MAX_SEATS) {
        this.toasts.show(`Maximum ${MAX_SEATS} seats per booking`);
        return;
      }
      ids.forEach((id) => selected.add(id));
    }
    this.selectedIds.set(selected);
    this.bookings.update({ seats: [...selected] });
  }

  cancel(): void {
    this.bookings.clear();
    void this.router.navigate(['/']);
  }

  continueToSummary(): void {
    const screening = this.screening();
    if (!screening || this.selectedCount() === 0) {
      return;
    }
    void this.router.navigate(['/screenings', screening.id, 'summary']);
  }
}
