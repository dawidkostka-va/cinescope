import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { CinemaApi } from '../api';
import { BookingService } from '../booking/booking';
import { formatShowDate } from '../dates';
import { Movie, Screening } from '../models';
import { Toaster } from '../toast/toast';
import { AUDITORIUM, Cell, isSeatLike } from './auditorium';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

const MAX_SEATS = 10;

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

function stateOf(cell: Cell, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): SeatState | null {
  if (!isSeatLike(cell)) {
    return null;
  }
  if (cell.ids.some((id) => occupied.has(id))) {
    return 'unavailable';
  }
  if (cell.ids.every((id) => selected.has(id))) {
    return 'selected';
  }
  return cell.accessible ? 'accessible' : 'available';
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  readonly id = input.required<string>();

  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);
  private readonly bookings = inject(BookingService);

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly selected = signal<ReadonlySet<string>>(new Set());

  readonly legend = LEGEND;

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));

  readonly showDate = computed(() => {
    const screening = this.screening();
    return screening ? formatShowDate(screening.date, screening.time) : '';
  });

  readonly selectedCount = computed(() => this.selected().size);

  readonly selectedRows = computed(() => {
    const selected = this.selected();
    return AUDITORIUM.map((row) => ({
      row: row.row,
      labels: row.cells
        .filter((cell) => isSeatLike(cell) && cell.ids.every((id) => selected.has(id)))
        .map((cell) => (cell.kind === 'couch' ? `${cell.start}-${cell.end}` : `${cell.start}`)),
    })).filter((row) => row.labels.length > 0);
  });

  readonly rows = computed(() => {
    const occupied = this.occupied();
    const selected = this.selected();
    return AUDITORIUM.map((row) => ({
      row: row.row,
      cells: row.cells.map((cell) => ({ cell, state: stateOf(cell, occupied, selected) })),
    }));
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.api.screeningWithMovie(Number(id)).pipe(
            catchError(() => {
              this.router.navigate(['/']);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ screening, movie }) => {
        this.screening.set(screening);
        this.movie.set(movie);
        this.selected.set(new Set(this.bookings.startOrResume(screening.id).seats));
      });
  }

  select(cell: Cell): void {
    const screening = this.screening();
    if (!screening || !isSeatLike(cell) || cell.ids.some((id) => this.occupied().has(id))) {
      return;
    }
    const selected = this.selected();
    const deselect = cell.ids.every((id) => selected.has(id));
    if (!deselect && selected.size + cell.ids.length > MAX_SEATS) {
      this.toaster.show('Maximum 10 seats per booking');
      return;
    }
    const seats = deselect
      ? [...selected].filter((id) => !cell.ids.includes(id))
      : [...selected, ...cell.ids];
    this.selected.set(new Set(seats));
    this.bookings.save({ ...this.bookings.current(), screeningId: screening.id, seats });
  }

  cancel(): void {
    this.bookings.clear();
    this.selected.set(new Set());
    this.router.navigate(['/']);
  }

  continue(): void {
    const screening = this.screening();
    if (!screening || this.selectedCount() === 0) {
      return;
    }
    this.router.navigate(['/screenings', screening.id, 'summary']);
  }
}
