import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { BookingService } from '../../core/booking.service';
import { formatShowDate } from '../../core/date-utils';
import { Movie, Screening } from '../../core/models';
import { MoviesService } from '../../core/movies.service';
import { ScreeningsService } from '../../core/screenings.service';
import { groupSelection } from '../../core/selection.util';
import {
  AISLE_TRACKS,
  LABEL_LEFT_TRACK,
  LABEL_RIGHT_TRACK,
  MAX_SEATS_PER_BOOKING,
  ROW_COUNT,
  RowCell,
  SeatState,
  buildRowCells,
  formatPrice,
  isAccessibleSeat,
  priceForSeat,
  seatId,
  trackForColumn,
} from '../../core/seat-map.util';
import { ToastService } from '../../core/toast.service';

interface RowData {
  row: number;
  cells: RowCell[];
}

interface SelectedRowLine {
  row: number;
  seats: string;
}

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.component.html',
  styleUrl: './seat-map.component.scss',
})
export class SeatMapComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly screeningsService = inject(ScreeningsService);
  private readonly moviesService = inject(MoviesService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly maxSeats = MAX_SEATS_PER_BOOKING;
  readonly labelLeftTrack = LABEL_LEFT_TRACK;
  readonly labelRightTrack = LABEL_RIGHT_TRACK;
  readonly aisleTracks = AISLE_TRACKS;

  readonly legendItems: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  readonly rows: RowData[] = Array.from({ length: ROW_COUNT }, (_, i) => {
    const row = i + 1;
    return { row, cells: buildRowCells(row) };
  });

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  private readonly screening = signal<Screening | null>(null);
  private readonly movie = signal<Movie | null>(null);

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));

  private readonly selectedIds = computed(() => {
    const booking = this.bookingService.booking();
    return booking.screeningId === this.screeningId() ? new Set(booking.seats) : new Set<string>();
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${formatShowDate(screening.date, screening.time)}` : '';
  });

  readonly rowLines = computed<SelectedRowLine[]>(() => {
    const items = groupSelection([...this.selectedIds()]);
    const byRow = new Map<number, string[]>();
    for (const item of items) {
      const label = item.isCouch ? `${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`;
      const seats = byRow.get(item.row) ?? [];
      seats.push(label);
      byRow.set(item.row, seats);
    }
    return [...byRow.entries()].map(([row, seats]) => ({ row, seats: seats.join(', ') }));
  });

  readonly loaded = computed(() => this.screening() !== null && this.movie() !== null);

  constructor() {
    effect(() => {
      this.loadScreening(this.screeningId());
    });
  }

  private loadScreening(id: number): void {
    this.screening.set(null);
    this.movie.set(null);

    if (!Number.isFinite(id)) {
      this.router.navigateByUrl('/');
      return;
    }

    this.screeningsService
      .getById(id)
      .pipe(switchMap((screening) => this.moviesService.getById(screening.movieId).pipe(map((movie) => ({ screening, movie })))))
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
          this.bookingService.ensureBookingFor(id);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  trackForColumn(column: number): number {
    return trackForColumn(column);
  }

  seatState(row: number, column: number): SeatState {
    const id = seatId(row, column);
    if (this.occupied().has(id)) return 'unavailable';
    if (this.selectedIds().has(id)) return 'selected';
    if (isAccessibleSeat(row, column)) return 'accessible';
    return 'available';
  }

  couchState(row: number, columnStart: number, columnEnd: number): SeatState {
    const idA = seatId(row, columnStart);
    const idB = seatId(row, columnEnd);
    if (this.occupied().has(idA) || this.occupied().has(idB)) return 'unavailable';
    if (this.selectedIds().has(idA) && this.selectedIds().has(idB)) return 'selected';
    return 'available';
  }

  seatPrice(row: number): string {
    return formatPrice(priceForSeat(row));
  }

  clickSeat(row: number, column: number): void {
    if (this.seatState(row, column) === 'unavailable') return;
    const result = this.bookingService.toggleSelection([seatId(row, column)]);
    if (result === 'limit') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  clickCouch(row: number, columnStart: number, columnEnd: number): void {
    if (this.couchState(row, columnStart, columnEnd) === 'unavailable') return;
    const result = this.bookingService.toggleSelection([seatId(row, columnStart), seatId(row, columnEnd)]);
    if (result === 'limit') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  continue(): void {
    if (this.selectedCount() === 0) return;
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }
}
