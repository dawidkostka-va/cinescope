import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, forkJoin, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { COUCH_ROW, MAX_SEATS, ROWS, buildItems, couchIds, formatShowDate, seatId } from '../core/seating';
import { ToastService } from '../core/toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface Cell {
  couch: boolean;
  start: number;
  end: number;
  gridColumn: string;
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

function gridColumn(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

function buildRows(): RowModel[] {
  return Array.from({ length: ROWS }, (_, i) => {
    const row = i + 1;
    const cells: Cell[] = [];
    if (row === COUCH_ROW) {
      for (let start = 1; start <= 23; start += 2) {
        cells.push({ couch: true, start, end: start + 1, gridColumn: `${gridColumn(start)} / span 2` });
      }
    } else {
      for (let column = row <= 10 ? 5 : 1; column <= 24; column++) {
        cells.push({ couch: false, start: column, end: column, gridColumn: `${gridColumn(column)}` });
      }
    }
    return { row, cells };
  });
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelectionComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly rows = buildRows();
  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly subtitle = computed(() => {
    const s = this.screening();
    return s ? `Show Date: ${formatShowDate(s.date, s.time)}` : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => new Set(this.booking.booking()?.seats ?? []));

  protected readonly seatCount = this.booking.seatCount;

  protected readonly selectionRows = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of buildItems(this.booking.booking()?.seats ?? [])) {
      const text = item.couch ? `${item.colStart}-${item.colEnd}` : `${item.colStart}`;
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), text]);
    }
    return [...byRow.entries()].map(([row, seats]) => ({ row, text: `Row ${row}: ${seats.join(', ')}` }));
  });

  constructor() {
    this.api
      .screening(this.screeningId)
      .pipe(
        switchMap((screening) =>
          forkJoin({ screening: of(screening), movie: this.api.movie(screening.movieId) }),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.booking.open(this.screeningId);
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected seatState(row: number, column: number): SeatState {
    const id = seatId(row, column);
    if (this.occupied().has(id)) return 'unavailable';
    if (this.selected().has(id)) return 'selected';
    return row === 1 && column >= 10 && column <= 15 ? 'accessible' : 'available';
  }

  protected couchState(start: number): SeatState {
    const ids = couchIds(start);
    if (ids.some((id) => this.occupied().has(id))) return 'unavailable';
    return ids.every((id) => this.selected().has(id)) ? 'selected' : 'available';
  }

  protected toggle(row: number, start: number, state: SeatState): void {
    if (state === 'unavailable') return;
    const ids = row === COUCH_ROW ? couchIds(start) : [seatId(row, start)];
    if (state === 'selected') {
      this.booking.removeSeats(ids);
    } else if (this.booking.hasRoomFor(ids.length)) {
      this.booking.addSeats(ids);
    } else {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
    }
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    if (this.seatCount() === 0) return;
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
