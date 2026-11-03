import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { API_URL } from '../api';
import { BookingService } from '../booking.service';
import { showDate } from '../dates';
import { Movie, Screening } from '../models';
import { ToastService } from '../toast.service';
import {
  COUCH_ROW,
  couchIds,
  isAccessible,
  MAX_SEATS,
  parseSeatId,
  seatId,
  toggleSeats,
} from '../seats';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatView {
  id: string;
  row: number;
  column: number;
  track: number;
  state: SeatState;
}

export interface CouchView {
  row: number;
  startColumn: number;
  endColumn: number;
  track: number;
  state: SeatState;
  ids: [string, string];
}

export interface RowView {
  number: number;
  seats: SeatView[];
  couches: CouchView[];
}

export interface SelectedRow {
  row: number;
  text: string;
}

const LEFT_LABEL_TRACK = 1;
const LEFT_AISLE_TRACK = 6;
const RIGHT_AISLE_TRACK = 23;
const RIGHT_LABEL_TRACK = 28;

export function columnTrack(column: number): number {
  if (column <= 4) {
    return column + 1;
  }
  if (column <= 20) {
    return column + 2;
  }
  return column + 3;
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.scss',
})
export class SeatSelectionComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);

  readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${showDate(screening.date, screening.time)}` : '';
  });

  readonly selectedSeats = computed(() => this.booking.booking()?.seats ?? []);
  readonly selectedCount = computed(() => this.selectedSeats().length);

  readonly selectedRows = computed<SelectedRow[]>(() => {
    const byRow = new Map<number, number[]>();
    for (const id of this.selectedSeats()) {
      const { row, column } = parseSeatId(id);
      byRow.set(row, [...(byRow.get(row) ?? []), column]);
    }
    return [...byRow.entries()]
      .sort(([a], [b]) => a - b)
      .map(([row, columns]) => {
        const sorted = [...columns].sort((a, b) => a - b);
        const parts = row === COUCH_ROW ? couchLabels(sorted) : sorted.map(String);
        return { row, text: `Row ${row}: ${parts.join(', ')}` };
      });
  });

  readonly rows = computed<RowView[]>(() => {
    const occupied = new Set(this.screening()?.occupiedSeats ?? []);
    const selected = new Set(this.selectedSeats());
    const stateOf = (row: number, column: number): SeatState => {
      const id = seatId(row, column);
      if (occupied.has(id)) {
        return 'unavailable';
      }
      if (selected.has(id)) {
        return 'selected';
      }
      return isAccessible(row, column) ? 'accessible' : 'available';
    };

    return Array.from({ length: 15 }, (_, index) => {
      const number = index + 1;
      if (number === COUCH_ROW) {
        const couches: CouchView[] = [];
        for (let start = 1; start <= 23; start += 2) {
          const ids = couchIds(start);
          let state: SeatState = 'available';
          if (ids.some((id) => occupied.has(id))) {
            state = 'unavailable';
          } else if (ids.every((id) => selected.has(id))) {
            state = 'selected';
          }
          couches.push({
            row: number,
            startColumn: start,
            endColumn: start + 1,
            track: columnTrack(start),
            state,
            ids,
          });
        }
        return { number, seats: [], couches };
      }
      const firstColumn = number <= 10 ? 5 : 1;
      const seats: SeatView[] = [];
      for (let column = firstColumn; column <= 24; column++) {
        seats.push({
          id: seatId(number, column),
          row: number,
          column,
          track: columnTrack(column),
          state: stateOf(number, column),
        });
      }
      return { number, seats, couches: [] };
    });
  });

  readonly leftAisleTrack = LEFT_AISLE_TRACK;
  readonly rightAisleTrack = RIGHT_AISLE_TRACK;
  readonly leftLabelTrack = LEFT_LABEL_TRACK;
  readonly rightLabelTrack = RIGHT_LABEL_TRACK;

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.http.get<Screening>(`${API_URL}/screenings/${id}`).pipe(
            switchMap((screening) =>
              this.http
                .get<Movie>(`${API_URL}/movies/${screening.movieId}`)
                .pipe(map((movie) => ({ screening, movie }))),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
          const current = this.booking.booking();
          if (!current || current.screeningId !== screening.id || current.paidEmail !== null) {
            this.booking.start(screening.id);
          }
        },
        error: () => this.router.navigate(['/']),
      });
  }

  onSeatClick(state: SeatState, ids: string[]): void {
    if (state === 'unavailable') {
      return;
    }
    const result = toggleSeats(this.selectedSeats(), ids);
    if (result.exceedsLimit) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    }
    this.booking.update({ seats: result.seats });
  }

  cancel(): void {
    this.booking.clear();
    this.router.navigate(['/']);
  }

  continue(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    this.router.navigate(['/screenings', this.id(), 'summary']);
  }
}

function couchLabels(columns: number[]): string[] {
  const starts = [...new Set(columns.map((column) => (column % 2 === 1 ? column : column - 1)))];
  return starts.map((start) => `${start}-${start + 1}`);
}
