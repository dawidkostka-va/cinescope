import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { formatShowDate } from '../core/dates';
import { Screening } from '../core/models';
import { COUCH_ROW, MAX_SEATS, ROW_COUNT, seatCountOf, seatId } from '../core/seat-utils';
import { ToastService } from '../core/toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface Cell {
  key: string;
  ids: string[];
  row: number;
  colStart: number;
  colEnd: number;
  couch: boolean;
  gridColumn: string;
}

interface Row {
  row: number;
  cells: Cell[];
}

const gridColumnOf = (column: number) => (column <= 4 ? column + 1 : column <= 20 ? column + 2 : column + 3);

const ROWS: Row[] = Array.from({ length: ROW_COUNT }, (_, i) => {
  const row = i + 1;
  const cells: Cell[] = [];
  if (row === COUCH_ROW) {
    for (let start = 1; start <= 23; start += 2) {
      cells.push({
        key: seatId(row, start),
        ids: [seatId(row, start), seatId(row, start + 1)],
        row,
        colStart: start,
        colEnd: start + 1,
        couch: true,
        gridColumn: `${gridColumnOf(start)} / span 2`,
      });
    }
  } else {
    for (let column = row <= 10 ? 5 : 1; column <= 24; column++) {
      cells.push({
        key: seatId(row, column),
        ids: [seatId(row, column)],
        row,
        colStart: column,
        colEnd: column,
        couch: false,
        gridColumn: `${gridColumnOf(column)}`,
      });
    }
  }
  return { row, cells };
});

export const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  protected readonly bookingService = inject(BookingService);

  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);
  protected readonly subtitle = computed(() => {
    const s = this.screening();
    return s ? formatShowDate(s.date, s.time) : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => new Set(this.bookingService.booking()?.seats ?? []));

  protected readonly rows = computed(() =>
    ROWS.map((r) => ({
      row: r.row,
      cells: r.cells.map((cell) => ({ cell, state: this.stateOf(cell) })),
    })),
  );

  protected readonly selectedLines = computed(() => {
    const lines = new Map<number, string[]>();
    for (const item of this.bookingService.items()) {
      const text = item.couch ? `${item.colStart}-${item.colEnd}` : String(item.colStart);
      lines.set(item.row, [...(lines.get(item.row) ?? []), text]);
    }
    return [...lines].map(([row, seats]) => ({ row, text: `Row ${row}: ${seats.join(', ')}` }));
  });

  private screeningId = NaN;

  constructor() {
    const raw = this.route.snapshot.paramMap.get('id') ?? '';
    if (!/^\d+$/.test(raw)) {
      this.router.navigateByUrl('/');
      return;
    }
    this.screeningId = Number(raw);
    this.api
      .screening(this.screeningId)
      .pipe(
        switchMap((screening) => this.api.movie(screening.movieId).pipe(map(() => screening))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (screening) => {
          this.bookingService.startFor(this.screeningId);
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  private stateOf(cell: Cell): SeatState {
    if (cell.ids.some((id) => this.occupied().has(id))) return 'unavailable';
    if (this.selected().has(cell.key)) return 'selected';
    if (cell.row === 1 && cell.colStart >= 10 && cell.colStart <= 15) return 'accessible';
    return 'available';
  }

  protected toggle(cell: Cell, state: SeatState): void {
    if (state === 'unavailable') return;
    if (state === 'selected') {
      this.bookingService.remove(cell.key);
      return;
    }
    if (this.bookingService.seatCount() + seatCountOf(cell.key) > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.bookingService.add(cell.key);
  }

  protected cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    if (this.bookingService.seatCount() === 0) return;
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
