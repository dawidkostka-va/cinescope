import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { BookingStore, SelectedUnit, unitKey } from '../booking';
import { formatShowDate } from '../date-utils';
import { LoadedScreening, ScreeningLoader } from '../screening-loader';
import { Toast } from '../toast';
import { AuditoriumCell, SeatState, buildAuditorium } from './auditorium';

/** A `Row <r>: <seats>` line of the selected-seats panel. */
interface SelectedRow {
  row: number;
  seats: string;
}

/** Background state of a cell: its own state, or `selected` while it is part of the selection. */
export type DisplayState = SeatState | 'selected';

const MAX_SEATS = 10;
const LIMIT_MESSAGE = 'Maximum 10 seats per booking';

const LEGEND: readonly { state: DisplayState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

/** Number of seats a unit holds: a seat is 1, a couch is 2. */
function seatsIn(unit: SelectedUnit): number {
  return unit.end - unit.start + 1;
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(Toast);
  private readonly booking = inject(BookingStore);
  private readonly screenings = inject(ScreeningLoader);

  /** Null until the screening and its movie have loaded. */
  protected readonly view = signal<LoadedScreening | null>(null);

  protected readonly showDate = computed(() => {
    const loaded = this.view();
    return loaded ? formatShowDate(loaded.screening.date, loaded.screening.time) : '';
  });

  protected readonly rows = computed(() => {
    const loaded = this.view();
    return loaded ? buildAuditorium(new Set(loaded.screening.occupiedSeats)) : [];
  });

  protected readonly legend = LEGEND;

  protected readonly selection = signal<SelectedUnit[]>([]);

  protected readonly selectedKeys = computed(
    () => new Set(this.selection().map((unit) => unitKey(unit.row, unit.start))),
  );

  protected readonly selectedCount = computed(() =>
    this.selection().reduce((total, unit) => total + seatsIn(unit), 0),
  );

  /** One line per row with a selection, rows ascending, seats ascending by column. */
  protected readonly selectedRows = computed<SelectedRow[]>(() => {
    const units = [...this.selection()].sort((a, b) => a.row - b.row || a.start - b.start);
    const byRow = new Map<number, string[]>();
    for (const unit of units) {
      const label = unit.start === unit.end ? `${unit.start}` : `${unit.start}-${unit.end}`;
      byRow.set(unit.row, [...(byRow.get(unit.row) ?? []), label]);
    }
    return [...byRow].map(([row, labels]) => ({ row, seats: labels.join(', ') }));
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        switchMap((id) =>
          this.screenings.load(id).pipe(
            catchError(() => {
              this.router.navigate(['/']);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((loaded) => {
        this.view.set(loaded);
        // Keep the unpaid booking in progress when it belongs to this screening; otherwise start a new, empty one.
        const existing = this.booking.read();
        const kept =
          existing?.screeningId === loaded.screening.id && existing.paidEmail === undefined ? existing : null;
        if (!kept) {
          this.booking.write({ screeningId: loaded.screening.id, units: [] });
        }
        this.selection.set(kept?.units ?? []);
      });
  }

  protected displayState(row: number, cell: AuditoriumCell): DisplayState | null {
    if (cell.state === null || cell.state === 'unavailable') {
      return cell.state;
    }
    return this.selectedKeys().has(unitKey(row, cell.start)) ? 'selected' : cell.state;
  }

  /** Selects a free seat or couch, or deselects it when already selected. */
  protected toggle(row: number, cell: AuditoriumCell): void {
    if (cell.state === null || cell.state === 'unavailable') {
      return;
    }
    const key = unitKey(row, cell.start);
    if (this.selectedKeys().has(key)) {
      this.commit(this.selection().filter((unit) => unitKey(unit.row, unit.start) !== key));
      return;
    }
    const unit: SelectedUnit = { row, start: cell.start, end: cell.end };
    if (this.selectedCount() + seatsIn(unit) > MAX_SEATS) {
      this.toast.show(LIMIT_MESSAGE);
      return;
    }
    this.commit([...this.selection(), unit]);
  }

  /** Clears the booking and leaves for the movie list. */
  protected cancel(): void {
    this.booking.clear();
    this.selection.set([]);
    this.router.navigate(['/']);
  }

  /** Opens the summary; does nothing without a selected seat. */
  protected proceed(): void {
    const loaded = this.view();
    if (!loaded || this.selectedCount() === 0) {
      return;
    }
    this.router.navigate(['/screenings', loaded.screening.id, 'summary']);
  }

  /** Sets the selection and stores it in the booking in progress. */
  private commit(units: SelectedUnit[]): void {
    this.selection.set(units);
    this.booking.update({ units });
  }
}
