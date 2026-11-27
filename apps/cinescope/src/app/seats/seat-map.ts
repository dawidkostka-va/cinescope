import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { showDate } from '../core/dates';
import { Screening } from '../core/models';
import {
  COLUMNS,
  COUCH_ROW,
  MAX_SEATS,
  ROWS,
  isAccessible,
  seatId,
  ticketItems,
} from '../core/seats';
import { ToastService } from '../core/toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface Cell {
  kind: 'seat' | 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  ids: string[];
  state: SeatState;
}

interface Row {
  row: number;
  cells: Cell[];
}

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-map',
  imports: [MatButton],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);
  protected readonly subtitle = computed(() => {
    const s = this.screening();
    return s ? `Show Date: ${showDate(s.date, s.time)}` : '';
  });

  private readonly selected = computed(() => new Set(this.booking.booking().seats));

  protected readonly rows = computed<Row[]>(() => {
    const screening = this.screening();
    if (!screening) return [];
    const occupied = new Set(screening.occupiedSeats);
    const selected = this.selected();
    const rows: Row[] = [];
    for (let row = 1; row <= ROWS; row++) {
      const cells: Cell[] = [];
      if (row === COUCH_ROW) {
        for (let start = 1; start <= COLUMNS; start += 2) {
          const ids = [seatId(row, start), seatId(row, start + 1)];
          const state: SeatState = ids.some((id) => occupied.has(id))
            ? 'unavailable'
            : selected.has(ids[0])
              ? 'selected'
              : 'available';
          cells.push({ kind: 'couch', row, columnStart: start, columnEnd: start + 1, ids, state });
        }
      } else {
        for (let column = row <= 10 ? 5 : 1; column <= COLUMNS; column++) {
          const id = seatId(row, column);
          const state: SeatState = occupied.has(id)
            ? 'unavailable'
            : selected.has(id)
              ? 'selected'
              : isAccessible(row, column)
                ? 'accessible'
                : 'available';
          cells.push({
            kind: 'seat',
            row,
            columnStart: column,
            columnEnd: column,
            ids: [id],
            state,
          });
        }
      }
      rows.push({ row, cells });
    }
    return rows;
  });

  protected readonly seatCount = computed(() => this.booking.booking().seats.length);
  protected readonly rowSummaries = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of ticketItems(this.booking.booking().seats)) {
      const text = item.couch ? `${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`;
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), text]);
    }
    return [...byRow].map(([row, seats]) => ({ row, text: `Row ${row}: ${seats.join(', ')}` }));
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.api
      .screening(id)
      .pipe(
        tap((screening) => {
          if (!this.booking.matchesScreening(screening.id)) {
            this.booking.start(screening.id);
          }
        }),
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(tap(() => this.screening.set(screening))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ error: () => this.router.navigateByUrl('/') });
  }

  protected toggle(cell: Cell): void {
    if (cell.state === 'unavailable') return;
    const seats = this.booking.booking().seats;
    if (cell.state === 'selected') {
      this.booking.setSeats(seats.filter((s) => !cell.ids.includes(s)));
      return;
    }
    if (seats.length + cell.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.booking.setSeats([...seats, ...cell.ids]);
  }

  protected gridColumn(column: number): number {
    return column <= 4 ? column + 1 : column <= 20 ? column + 2 : column + 3;
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    const s = this.screening();
    if (!s || this.seatCount() === 0) return;
    this.router.navigate(['/screenings', s.id, 'summary']);
  }
}
