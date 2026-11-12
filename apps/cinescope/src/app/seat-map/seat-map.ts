import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { showDate } from '../core/dates';
import { Movie, Screening } from '../core/models';
import {
  COUCH_ROW,
  MAX_SEATS,
  ROW_COUNT,
  compareKeys,
  describeShort,
  keyOf,
  parseKey,
  seatCount,
  seatIds,
  totalSeats,
} from '../core/seats';
import { ToastService } from '../core/toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface Cell {
  kind: 'seat' | 'couch' | 'aisle';
  key: string;
  col: number;
  colEnd: number;
  gridColumn: string;
}

interface RowLayout {
  row: number;
  cells: Cell[];
}

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

/** Grid column of a seat column: column 1 is grid column 2 (1 is the left row label). */
function gridColumn(col: number): number {
  if (col <= 4) return col + 1;
  if (col <= 20) return col + 2;
  return col + 3;
}

function buildLayout(): RowLayout[] {
  const rows: RowLayout[] = [];
  for (let row = 1; row <= ROW_COUNT; row++) {
    const cells: Cell[] = [
      { kind: 'aisle', key: '', col: 0, colEnd: 0, gridColumn: '6' },
      { kind: 'aisle', key: '', col: 0, colEnd: 0, gridColumn: '23' },
    ];
    if (row === COUCH_ROW) {
      for (let col = 1; col <= 24; col += 2) {
        cells.push({
          kind: 'couch',
          key: keyOf(row, col),
          col,
          colEnd: col + 1,
          gridColumn: `${gridColumn(col)} / span 2`,
        });
      }
    } else {
      for (let col = row <= 10 ? 5 : 1; col <= 24; col++) {
        cells.push({
          kind: 'seat',
          key: keyOf(row, col),
          col,
          colEnd: col,
          gridColumn: String(gridColumn(col)),
        });
      }
    }
    cells.sort((a, b) => parseInt(a.gridColumn, 10) - parseInt(b.gridColumn, 10));
    rows.push({ row, cells });
  }
  return rows;
}

const LAYOUT = buildLayout();

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly legend = LEGEND;
  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);

  protected readonly subtitle = computed(() => {
    const s = this.data()?.screening;
    return s ? `Show Date: ${showDate(s.date, s.time)}` : '';
  });

  private readonly selectedKeys = computed(() => {
    const b = this.booking.booking();
    const s = this.data()?.screening;
    return b && s && !b.paid && b.screeningId === s.id ? b.items : [];
  });

  protected readonly rows = computed(() => {
    const screening = this.data()?.screening;
    if (!screening) return [];
    const occupied = new Set(screening.occupiedSeats);
    const selected = new Set(this.selectedKeys());
    return LAYOUT.map((r) => ({
      row: r.row,
      cells: r.cells.map((cell) => ({ cell, state: this.stateOf(cell, occupied, selected) })),
    }));
  });

  protected readonly selectedCount = computed(() => totalSeats(this.selectedKeys()));

  protected readonly selectedRows = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const key of [...this.selectedKeys()].sort(compareKeys)) {
      const row = parseKey(key).row;
      byRow.set(row, [...(byRow.get(row) ?? []), describeShort(key)]);
    }
    return [...byRow].map(([row, seats]) => ({ row, text: seats.join(', ') }));
  });

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => params.get('id') ?? ''),
        tap(() => this.data.set(null)),
        switchMap((id) =>
          this.api.loadScreening(id).pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (!result) {
          this.router.navigateByUrl('/');
          return;
        }
        const current = this.booking.booking();
        if (!current || current.paid || current.screeningId !== result.screening.id) {
          this.booking.start(result.screening.id);
        }
        this.data.set(result);
      });
  }

  private stateOf(cell: Cell, occupied: Set<string>, selected: Set<string>): SeatState {
    if (seatIds(cell.key).some((id) => occupied.has(id))) return 'unavailable';
    if (selected.has(cell.key)) return 'selected';
    const { row, col } = parseKey(cell.key);
    return cell.kind === 'seat' && row === 1 && col >= 10 && col <= 15 ? 'accessible' : 'available';
  }

  protected toggle(cell: Cell, state: SeatState): void {
    if (state === 'unavailable') return;
    const items = this.selectedKeys();
    if (state === 'selected') {
      this.booking.setItems(items.filter((k) => k !== cell.key));
      return;
    }
    if (totalSeats(items) + seatCount(cell.key) > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.booking.setItems([...items, cell.key]);
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    const screening = this.data()?.screening;
    if (screening && this.selectedKeys().length > 0) {
      this.router.navigate(['/screenings', screening.id, 'summary']);
    }
  }

  protected hasSelection(): boolean {
    return this.selectedKeys().length > 0;
  }
}
