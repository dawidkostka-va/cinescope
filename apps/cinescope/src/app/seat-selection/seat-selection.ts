import { Component, effect, inject, input, resource, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BookedItem, BookingStore, itemKey } from '../booking';
import { CinemaApi } from '../cinema-api';
import { formatShowDate } from '../dates';
import { Movie, Screening } from '../models';
import { Toast } from '../toast';

const ROW_NUMBERS = Array.from({ length: 15 }, (_, index) => index + 1);
/** Rows 1 to 10 have no seats in columns 1 to 4; that space is the entrance. */
const LAST_ENTRANCE_ROW = 10;
/** Row 15 is made of couches only. */
const COUCH_ROW = 15;
const ACCESSIBLE_ROW = 1;
const ACCESSIBLE_FIRST_COLUMN = 10;
const ACCESSIBLE_LAST_COLUMN = 15;
/** A booking holds at most this many seats; a couch counts as two. */
const MAX_SEATS = 10;

export type SeatState = 'available' | 'unavailable' | 'accessible';
type DisplayState = SeatState | 'selected';

type Slot =
  | { kind: 'seat'; key: string; row: number; column: number; state: SeatState }
  | { kind: 'couch'; key: string; row: number; start: number; end: number; state: SeatState }
  | { kind: 'aisle'; key: string; row: number }
  | { kind: 'entrance'; key: string };

/** A seat or a couch: the elements that can be selected. */
type Bookable = Extract<Slot, { state: SeatState }>;

interface SeatMapRow {
  number: number;
  slots: Slot[];
}

interface SeatMapData {
  movie: Movie;
  screening: Screening;
  showDate: string;
}

interface SelectedRow {
  row: number;
  seats: string;
}

const LEGEND: { state: DisplayState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

function seatState(row: number, column: number, occupied: Set<string>): SeatState {
  if (occupied.has(seatId(row, column))) {
    return 'unavailable';
  }
  const accessible =
    row === ACCESSIBLE_ROW && column >= ACCESSIBLE_FIRST_COLUMN && column <= ACCESSIBLE_LAST_COLUMN;
  return accessible ? 'accessible' : 'available';
}

/** Slots for the columns `from`..`to` of a row: single seats, or couches of two columns in row 15. */
function segment(row: number, from: number, to: number, occupied: Set<string>): Slot[] {
  const slots: Slot[] = [];
  if (row === COUCH_ROW) {
    for (let start = from; start <= to; start += 2) {
      const end = start + 1;
      const unavailable = occupied.has(seatId(row, start)) || occupied.has(seatId(row, end));
      slots.push({
        kind: 'couch',
        key: `couch-${row}-${start}`,
        row,
        start,
        end,
        state: unavailable ? 'unavailable' : 'available',
      });
    }
    return slots;
  }
  for (let column = from; column <= to; column++) {
    slots.push({
      kind: 'seat',
      key: `seat-${row}-${column}`,
      row,
      column,
      state: seatState(row, column, occupied),
    });
  }
  return slots;
}

function aisle(row: number, after: number): Slot {
  return { kind: 'aisle', key: `aisle-${row}-${after}`, row };
}

function buildRow(row: number, occupied: Set<string>): Slot[] {
  const left: Slot[] =
    row <= LAST_ENTRANCE_ROW
      ? [{ kind: 'entrance', key: `entrance-${row}` }]
      : segment(row, 1, 4, occupied);
  return [
    ...left,
    aisle(row, 4),
    ...segment(row, 5, 20, occupied),
    aisle(row, 20),
    ...segment(row, 21, 24, occupied),
  ];
}

function isBookable(slot: Slot): slot is Bookable {
  return slot.kind === 'seat' || slot.kind === 'couch';
}

/** Seats taken by an element: a couch is two seats. */
function seatsIn(slot: Bookable): number {
  return slot.kind === 'couch' ? 2 : 1;
}

function toBookedItem(slot: Bookable): BookedItem {
  return slot.kind === 'couch'
    ? { row: slot.row, column: slot.start, couch: true }
    : { row: slot.row, column: slot.column, couch: false };
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly toast = inject(Toast);
  private readonly bookings = inject(BookingStore);

  /** Bound from the `id` route parameter. */
  readonly id = input.required<string>();

  protected readonly legend = LEGEND;

  /** Keys of the selected seats and couches, taken from the booking in progress. */
  private readonly selection = computed<ReadonlySet<string>>(
    () => new Set((this.bookings.booking()?.items ?? []).map(itemKey)),
  );

  protected readonly data = resource({
    params: () => this.id(),
    loader: async ({ params: id }): Promise<SeatMapData> => {
      const screening = await this.api.getScreening(Number(id));
      const movie = await this.api.getMovie(screening.movieId);
      this.bookings.open(screening.id);
      return { movie, screening, showDate: formatShowDate(screening.date, screening.time) };
    },
  });

  /** The loaded screening and movie; `undefined` while loading or after a failed load. */
  protected readonly loaded = computed(() => (this.data.hasValue() ? this.data.value() : undefined));

  protected readonly rows = computed<SeatMapRow[]>(() => {
    const data = this.loaded();
    if (!data) {
      return [];
    }
    const occupied = new Set(data.screening.occupiedSeats);
    return ROW_NUMBERS.map((number) => ({ number, slots: buildRow(number, occupied) }));
  });

  /** Selected elements in ascending row, then column order. */
  private readonly selectedSlots = computed<Bookable[]>(() => {
    const keys = this.selection();
    return this.rows()
      .flatMap((row) => row.slots)
      .filter(isBookable)
      .filter((slot) => keys.has(slot.key));
  });

  protected readonly selectedCount = computed(() =>
    this.selectedSlots().reduce((total, slot) => total + seatsIn(slot), 0),
  );

  protected readonly selectedRows = computed<SelectedRow[]>(() => {
    const labelsByRow = new Map<number, string[]>();
    for (const slot of this.selectedSlots()) {
      const label = slot.kind === 'couch' ? `${slot.start}-${slot.end}` : `${slot.column}`;
      labelsByRow.set(slot.row, [...(labelsByRow.get(slot.row) ?? []), label]);
    }
    return [...labelsByRow].map(([row, labels]) => ({ row, seats: labels.join(', ') }));
  });

  constructor() {
    effect(() => {
      if (this.data.error()) {
        this.router.navigate(['/']);
      }
    });
    effect(() => {
      const movie = this.loaded()?.movie;
      if (movie) {
        this.title.setTitle(`${movie.title} - Cinescope`);
      }
    });
  }

  /** The state a seat or couch is painted with: selected overrides its own state. */
  protected displayState(slot: Bookable): DisplayState {
    return this.selection().has(slot.key) ? 'selected' : slot.state;
  }

  protected toggle(slot: Bookable): void {
    if (slot.state === 'unavailable') {
      return;
    }
    const items = this.bookings.booking()?.items ?? [];
    if (this.selection().has(slot.key)) {
      this.bookings.setItems(items.filter((item) => itemKey(item) !== slot.key));
      return;
    }
    if (this.selectedCount() + seatsIn(slot) > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    }
    this.bookings.setItems([...items, toBookedItem(slot)]);
  }

  protected cancel(): void {
    this.bookings.clear();
    this.router.navigate(['/']);
  }

  protected continueToSummary(): void {
    if (this.selectedCount() > 0) {
      this.router.navigate(['/screenings', this.id(), 'summary']);
    }
  }
}
