import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { catchError, EMPTY, map, startWith, switchMap, tap } from 'rxjs';
import { auditoriumRows, Cell, cellsForIds, seatCount, sortByPosition } from '../auditorium';
import { newBooking, readBooking, clearBooking, writeBooking } from '../booking';
import { CinemaApi } from '../cinema-api';
import { showDate } from '../dates';
import { Movie, Screening } from '../models';
import { Toaster } from '../toast/toaster';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; screening: Screening; movie: Movie };

const MAX_SEATS = 10;

function label(cell: Cell): string {
  return cell.kind === 'couch' ? `${cell.start}-${cell.end}` : String(cell.column);
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
  private readonly toaster = inject(Toaster);

  readonly id = input.required<string>();

  protected readonly rows = auditoriumRows;

  protected readonly legend: { state: SeatState; name: string }[] = [
    { state: 'available', name: 'Available' },
    { state: 'selected', name: 'Selected' },
    { state: 'unavailable', name: 'Unavailable' },
    { state: 'accessible', name: 'Accessible' },
  ];

  protected readonly selected = signal<Cell[]>([]);

  protected readonly selectedCount = computed(() =>
    this.selected().reduce((total, cell) => total + seatCount(cell), 0),
  );

  protected readonly selectedRows = computed(() => {
    const seatsByRow = new Map<number, string[]>();
    for (const cell of sortByPosition(this.selected())) {
      seatsByRow.set(cell.row, [...(seatsByRow.get(cell.row) ?? []), label(cell)]);
    }
    return [...seatsByRow].map(([row, seats]) => ({ row, seats: seats.join(', ') }));
  });

  protected readonly state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.api.getScreeningDetails(Number(id)).pipe(
          tap(({ screening }) => this.openBooking(screening.id)),
          map((details): LoadState => ({ status: 'ready', ...details })),
          startWith<LoadState>({ status: 'loading' }),
          catchError(() => {
            void this.router.navigateByUrl('/');
            return EMPTY;
          }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as LoadState },
  );

  protected readonly subtitle = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? showDate(state.screening.date, state.screening.time) : '';
  });

  private readonly occupied = computed(() => {
    const state = this.state();
    return new Set(state.status === 'ready' ? state.screening.occupiedSeats : []);
  });

  protected stateOf(cell: Cell): SeatState {
    if (cell.ids.some((id) => this.occupied().has(id))) {
      return 'unavailable';
    }
    if (this.selected().includes(cell)) {
      return 'selected';
    }
    if (cell.kind === 'seat' && cell.accessible) {
      return 'accessible';
    }
    return 'available';
  }

  protected toggle(cell: Cell): void {
    const current = this.selected();
    let next: Cell[];
    if (current.includes(cell)) {
      next = current.filter((selected) => selected !== cell);
    } else {
      if (this.stateOf(cell) === 'unavailable') {
        return;
      }
      if (this.selectedCount() + seatCount(cell) > MAX_SEATS) {
        this.toaster.show(`Maximum ${MAX_SEATS} seats per booking`);
        return;
      }
      next = [...current, cell];
    }
    this.selected.set(next);
    this.saveSelection(next);
  }

  protected cancel(): void {
    clearBooking();
    void this.router.navigateByUrl('/');
  }

  protected goToSummary(): void {
    void this.router.navigate(['/screenings', this.id(), 'summary']);
  }

  protected track(column: number): number {
    if (column <= 4) {
      return column + 1;
    }
    if (column <= 20) {
      return column + 2;
    }
    return column + 3;
  }

  private openBooking(screeningId: number): void {
    const booking = readBooking();
    if (booking?.screeningId === screeningId && booking.paidEmail === null) {
      this.selected.set(cellsForIds(booking.itemIds));
      return;
    }
    this.selected.set([]);
    writeBooking(newBooking(screeningId));
  }

  private saveSelection(cells: Cell[]): void {
    const booking = readBooking();
    if (booking) {
      writeBooking({ ...booking, itemIds: cells.map((cell) => cell.id) });
    }
  }
}
