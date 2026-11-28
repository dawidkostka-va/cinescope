import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { Movie, Screening } from '../../core/models';
import {
  BookingItem,
  COLUMNS,
  COUCH_ROW,
  MAX_SEATS,
  ROWS,
  formatShowDate,
  itemsFromSeats,
  makeItem,
} from '../../core/seating';
import { ToastService } from '../../core/toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface Cell {
  key: string;
  kind: 'seat' | 'couch' | 'aisle';
  track: number;
  item?: BookingItem;
  state?: SeatState;
}

interface RowModel {
  number: number;
  cells: Cell[];
}

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

const FIRST_AISLE_TRACK = 6;
const SECOND_AISLE_TRACK = 23;

function trackOf(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);
  private readonly screeningId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${formatShowDate(screening.date, screening.time)}` : '';
  });

  private readonly selectedSeats = computed(() => {
    const screening = this.screening();
    const booking = this.booking.booking();
    return screening && booking && !booking.paid && booking.screeningId === screening.id ? booking.seats : [];
  });

  protected readonly selectedCount = computed(() => this.selectedSeats().length);

  protected readonly selectedRows = computed(() => {
    const rows = new Map<number, string[]>();
    for (const item of itemsFromSeats(this.selectedSeats())) {
      const label = item.couch ? `${item.columnStart}-${item.columnEnd}` : String(item.columnStart);
      rows.set(item.row, [...(rows.get(item.row) ?? []), label]);
    }
    return [...rows].map(([row, seats]) => ({ row, text: `Row ${row}: ${seats.join(', ')}` }));
  });

  protected readonly rows = computed<RowModel[]>(() => {
    const screening = this.screening();
    if (!screening) return [];
    const occupied = new Set(screening.occupiedSeats);
    const selected = new Set(this.selectedSeats());
    const result: RowModel[] = [];

    for (let row = 1; row <= ROWS; row++) {
      const cells: Cell[] = [];
      const firstColumn = row > 10 ? 1 : 5;
      const step = row === COUCH_ROW ? 2 : 1;
      for (let column = firstColumn; column <= COLUMNS; column += step) {
        if (column === 5) cells.push({ key: 'aisle-1', kind: 'aisle', track: FIRST_AISLE_TRACK });
        if (column === 21) cells.push({ key: 'aisle-2', kind: 'aisle', track: SECOND_AISLE_TRACK });
        const item = makeItem(row, column);
        const state: SeatState = item.ids.some((id) => occupied.has(id))
          ? 'unavailable'
          : item.ids.every((id) => selected.has(id))
            ? 'selected'
            : row === 1 && column >= 10 && column <= 15
              ? 'accessible'
              : 'available';
        cells.push({ key: item.ids[0], kind: item.couch ? 'couch' : 'seat', track: trackOf(column), item, state });
      }
      result.push({ number: row, cells });
    }
    return result;
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const screening = await this.api.getScreening(this.screeningId);
      const movie = await this.api.getMovie(screening.movieId);
      if (!this.booking.isInProgressFor(screening.id)) this.booking.start(screening.id);
      this.movie.set(movie);
      this.screening.set(screening);
    } catch {
      void this.router.navigateByUrl('/');
    }
  }

  protected toggle(cell: Cell): void {
    const item = cell.item;
    if (!item || cell.state === 'unavailable') return;
    if (cell.state !== 'selected' && this.selectedCount() + item.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.booking.toggle(item.ids);
  }

  protected cancel(): void {
    this.booking.clear();
    void this.router.navigateByUrl('/');
  }

  protected continue(): void {
    if (this.selectedCount() === 0) return;
    void this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
