import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { BookingStore } from '../../core/booking';
import { formatShowDate } from '../../core/dates';
import { Movie, Screening } from '../../core/models';
import {
  COUCH_ROW,
  MAX_SEATS,
  ROWS,
  SeatState,
  TicketItem,
  isAccessible,
  itemLabel,
  itemsFromSeats,
  seatId,
} from '../../core/seats';
import { ToastService } from '../../core/toast';

interface Cell {
  key: string;
  couch: boolean;
  columnStart: number;
  columnEnd: number;
  gridColumn: number;
  span: number;
  ids: string[];
}

interface RowLayout {
  row: number;
  cells: Cell[];
}

// grid: 1 label, 2-5 seats 1-4, 6 aisle, 7-22 seats 5-20, 23 aisle, 24-27 seats 21-24, 28 label
function gridColumn(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

function buildLayout(): RowLayout[] {
  const rows: RowLayout[] = [];
  for (let row = 1; row <= ROWS; row++) {
    const cells: Cell[] = [];
    if (row === COUCH_ROW) {
      for (let start = 1; start <= 24; start += 2) {
        cells.push({
          key: `${row}-${start}`,
          couch: true,
          columnStart: start,
          columnEnd: start + 1,
          gridColumn: gridColumn(start),
          span: 2,
          ids: [seatId(row, start), seatId(row, start + 1)],
        });
      }
    } else {
      for (let column = row <= 10 ? 5 : 1; column <= 24; column++) {
        cells.push({
          key: `${row}-${column}`,
          couch: false,
          columnStart: column,
          columnEnd: column,
          gridColumn: gridColumn(column),
          span: 1,
          ids: [seatId(row, column)],
        });
      }
    }
    rows.push({ row, cells });
  }
  return rows;
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButton],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(BookingStore);
  private readonly toast = inject(ToastService);

  protected readonly layout = buildLayout();
  protected readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);
  protected readonly loaded = computed(() => this.screening() !== null && this.store.booking() !== null);

  protected readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${formatShowDate(screening.date, screening.time)}` : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => new Set(this.store.booking()?.seats ?? []));
  protected readonly selectedCount = computed(() => this.selected().size);

  protected readonly selectedRows = computed(() => {
    const byRow = new Map<number, TicketItem[]>();
    for (const item of this.store.items()) {
      const list = byRow.get(item.row) ?? [];
      list.push(item);
      byRow.set(item.row, list);
    }
    return [...byRow.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([row, items]) => ({ row, text: `Row ${row}: ${items.map(itemLabel).join(', ')}` }));
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        switchMap((id) =>
          this.api.screening(id).pipe(
            switchMap((screening) =>
              this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
            ),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.store.openFor(screening.id);
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => void this.router.navigateByUrl('/', { replaceUrl: true }),
      });
  }

  protected state(row: number, cell: Cell): SeatState {
    if (cell.ids.some((id) => this.occupied().has(id))) return 'unavailable';
    if (cell.ids.every((id) => this.selected().has(id))) return 'selected';
    if (!cell.couch && isAccessible(row, cell.columnStart)) return 'accessible';
    return 'available';
  }

  protected toggle(row: number, cell: Cell): void {
    const state = this.state(row, cell);
    if (state === 'unavailable') return;
    const items = this.store.items();
    if (state === 'selected') {
      this.store.setItems(items.filter((item) => !item.ids.every((id) => cell.ids.includes(id))));
      return;
    }
    if (this.selectedCount() + cell.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.store.setItems(itemsFromSeats([...this.store.booking()!.seats, ...cell.ids]));
  }

  protected cancel(): void {
    this.store.clear();
    void this.router.navigateByUrl('/');
  }

  protected next(): void {
    if (this.selectedCount() === 0) return;
    void this.router.navigate(['/screenings', this.screening()!.id, 'summary']);
  }
}
