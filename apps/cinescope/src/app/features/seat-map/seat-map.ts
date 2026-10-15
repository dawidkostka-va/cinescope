import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import {
  AisleCell,
  CouchCell,
  EmptyCell,
  LEFT_LABEL_TRACK,
  ROW_LAYOUTS,
  RIGHT_LABEL_TRACK,
  RowCell,
  SeatCell,
} from '../../core/auditorium.util';
import { BookingService } from '../../core/booking.service';
import { formatShowDate } from '../../core/date.util';
import { ScreeningData } from '../../core/models';
import { buildBookingItems, groupItemsByRow, panelSeatLabel } from '../../core/seat.util';
import { ToastService } from '../../core/toast.service';

type CellState = 'available' | 'selected' | 'unavailable' | 'accessible';

const LEGEND_ITEMS: { state: CellState; label: string }[] = [
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
  readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  readonly rows = ROW_LAYOUTS;
  readonly legendItems = LEGEND_ITEMS;
  readonly leftLabelTrack = LEFT_LABEL_TRACK;
  readonly rightLabelTrack = RIGHT_LABEL_TRACK;

  private readonly dataSignal = signal<ScreeningData | null>(null);
  readonly data = this.dataSignal.asReadonly();

  readonly occupied = computed(() => new Set(this.data()?.screening.occupiedSeats ?? []));
  readonly selected = computed(() => new Set(this.bookingService.booking()?.seats ?? []));

  readonly subtitle = computed(() => {
    const d = this.data();
    return d ? `Show Date: ${formatShowDate(d.screening.date, d.screening.time)}` : '';
  });

  readonly selectedCount = computed(() => this.bookingService.booking()?.seats.length ?? 0);

  readonly selectedRows = computed(() => {
    const items = buildBookingItems(this.bookingService.booking()?.seats ?? []);
    return groupItemsByRow(items).map(({ row, items }) => ({
      row,
      label: items.map(panelSeatLabel).join(', '),
    }));
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.api.getMovieAndScreening(Number(id)).pipe(
            catchError(() => {
              this.router.navigateByUrl('/');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((data) => {
        this.dataSignal.set(data);
        this.bookingService.ensureBookingForScreening(data.screening.id);
      });
  }

  seatState(cell: SeatCell): CellState {
    if (this.occupied().has(cell.id)) return 'unavailable';
    if (this.selected().has(cell.id)) return 'selected';
    return cell.accessible ? 'accessible' : 'available';
  }

  couchState(cell: CouchCell): CellState {
    const occupied = this.occupied();
    if (cell.ids.some((id) => occupied.has(id))) return 'unavailable';
    const selected = this.selected();
    if (cell.ids.every((id) => selected.has(id))) return 'selected';
    return 'available';
  }

  onSeatClick(cell: SeatCell): void {
    if (this.seatState(cell) === 'unavailable') return;
    this.toggle([cell.id]);
  }

  onCouchClick(cell: CouchCell): void {
    if (this.couchState(cell) === 'unavailable') return;
    this.toggle(cell.ids);
  }

  private toggle(ids: string[]): void {
    const result = this.bookingService.toggleSeats(ids);
    if (result === 'limit-exceeded') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  cancel(): void {
    this.bookingService.clear();
    this.router.navigate(['/']);
  }

  continue(): void {
    if (this.selectedCount() === 0) return;
    const screeningId = this.data()?.screening.id;
    if (screeningId === undefined) return;
    this.router.navigate(['/screenings', screeningId, 'summary']);
  }

  isSeat(cell: RowCell): cell is SeatCell {
    return cell.kind === 'seat';
  }
  isCouch(cell: RowCell): cell is CouchCell {
    return cell.kind === 'couch';
  }
  isAisle(cell: RowCell): cell is AisleCell {
    return cell.kind === 'aisle';
  }
  isEmpty(cell: RowCell): cell is EmptyCell {
    return cell.kind === 'empty';
  }
}
