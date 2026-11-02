import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { formatShowDate } from '../core/dates';
import { Movie, Screening } from '../core/models';
import {
  COUCH_ROW,
  MAX_SEATS,
  ROWS,
  SeatState,
  buildTickets,
  describeTicket,
  isAccessible,
  seatId,
} from '../core/seats';
import { ToastService } from '../core/toast.service';

interface Cell {
  kind: 'seat' | 'couch' | 'aisle' | 'entrance';
  row: number;
  column: number;
  columnEnd: number;
  ids: string[];
  accessible: boolean;
}

interface RowModel {
  row: number;
  cells: Cell[];
}

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

function buildRows(): RowModel[] {
  const rows: RowModel[] = [];
  const blank = (kind: Cell['kind'], row: number): Cell => ({
    kind,
    row,
    column: 0,
    columnEnd: 0,
    ids: [],
    accessible: false,
  });
  for (let row = 1; row <= ROWS; row++) {
    const cells: Cell[] = [];
    const addRange = (from: number, to: number) => {
      if (row === COUCH_ROW) {
        for (let c = from; c < to; c += 2) {
          cells.push({
            kind: 'couch',
            row,
            column: c,
            columnEnd: c + 1,
            ids: [seatId(row, c), seatId(row, c + 1)],
            accessible: false,
          });
        }
      } else {
        for (let c = from; c <= to; c++) {
          cells.push({
            kind: 'seat',
            row,
            column: c,
            columnEnd: c,
            ids: [seatId(row, c)],
            accessible: isAccessible(row, c),
          });
        }
      }
    };
    if (row >= 11) addRange(1, 4);
    else cells.push(blank('entrance', row));
    cells.push(blank('aisle', row));
    addRange(5, 20);
    cells.push(blank('aisle', row));
    addRange(21, 24);
    rows.push({ row, cells });
  }
  return rows;
}

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMapComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly legend = LEGEND;
  protected readonly layout = buildRows();
  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly showDate = computed(() => {
    const s = this.screening();
    return s ? formatShowDate(s.date, s.time) : '';
  });

  private readonly selected = computed(() => new Set(this.booking.seats()));
  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));

  protected readonly seatCount = computed(() => this.booking.seats().length);
  protected readonly rowLines = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const t of buildTickets(this.booking.seats())) {
      byRow.set(t.row, [...(byRow.get(t.row) ?? []), describeTicket(t)]);
    }
    return [...byRow].map(([row, seats]) => ({ row, text: `Row ${row}: ${seats.join(', ')}` }));
  });

  constructor() {
    this.api
      .screeningWithMovie(this.screeningId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ screening, movie }) => {
          this.booking.openFor(this.screeningId);
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => this.router.navigateByUrl('/', { replaceUrl: true }),
      });
  }

  protected state(cell: Cell): SeatState {
    if (cell.ids.some((id) => this.occupied().has(id))) return 'unavailable';
    if (cell.ids.every((id) => this.selected().has(id))) return 'selected';
    return cell.accessible ? 'accessible' : 'available';
  }

  protected toggle(cell: Cell): void {
    const state = this.state(cell);
    if (state === 'unavailable') return;
    if (state === 'selected') {
      this.booking.removeSeats(cell.ids);
    } else if (this.booking.seats().length + cell.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.booking.addSeats(cell.ids);
    }
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    if (this.booking.seats().length === 0) return;
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
