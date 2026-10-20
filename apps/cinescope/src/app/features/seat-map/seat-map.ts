import { Component, computed, effect, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AISLE_TRACK_A, AISLE_TRACK_B, LABEL_TRACK_LEFT, LABEL_TRACK_RIGHT, ROWS, columnTrack, slotsForRow } from '../../core/auditorium';
import { BookingService } from '../../core/booking.service';
import { formatShowDate } from '../../core/date-utils';
import { ScreeningData } from '../../core/resolvers';
import { isAccessibleSeat, seatId, selectedSeatsByRow } from '../../core/seat-utils';
import { ToastService } from '../../core/toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface SeatCellView {
  kind: 'seat';
  row: number;
  column: number;
  track: number;
  state: SeatState;
  ids: string[];
}

interface CouchCellView {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  track: number;
  state: SeatState;
  ids: string[];
}

type CellView = SeatCellView | CouchCellView;

interface RowView {
  row: number;
  cells: CellView[];
}

const LEGEND: { state: SeatState; label: string; color: string }[] = [
  { state: 'available', label: 'Available', color: '#2E7D32' },
  { state: 'selected', label: 'Selected', color: '#F9A825' },
  { state: 'unavailable', label: 'Unavailable', color: '#C62828' },
  { state: 'accessible', label: 'Accessible', color: '#1565C0' },
];

const MAX_SEATS = 10;

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly data = input.required<ScreeningData>();

  protected readonly legend = LEGEND;
  protected readonly labelTrackLeft = LABEL_TRACK_LEFT;
  protected readonly labelTrackRight = LABEL_TRACK_RIGHT;
  protected readonly aisleTrackA = AISLE_TRACK_A;
  protected readonly aisleTrackB = AISLE_TRACK_B;

  protected readonly subtitle = computed(() => `Show Date: ${formatShowDate(this.data().screening.date, this.data().screening.time)}`);

  protected readonly occupied = computed(() => new Set(this.data().screening.occupiedSeats));
  protected readonly selectedSeatIds = computed(() => this.bookingService.booking()?.seats ?? []);
  private readonly selected = computed(() => new Set(this.selectedSeatIds()));

  protected readonly rows = computed<RowView[]>(() => {
    const occupied = this.occupied();
    const selected = this.selected();
    const rows: RowView[] = [];
    for (let row = 1; row <= ROWS; row++) {
      const cells: CellView[] = slotsForRow(row).map((slot) => {
        if (slot.kind === 'couch') {
          const ids = [seatId(row, slot.columnStart), seatId(row, slot.columnEnd)];
          return {
            kind: 'couch',
            row,
            columnStart: slot.columnStart,
            columnEnd: slot.columnEnd,
            track: columnTrack(slot.columnStart),
            state: cellState(ids, occupied, selected, false),
            ids,
          };
        }
        const ids = [seatId(row, slot.column)];
        return {
          kind: 'seat',
          row,
          column: slot.column,
          track: columnTrack(slot.column),
          state: cellState(ids, occupied, selected, isAccessibleSeat(row, slot.column)),
          ids,
        };
      });
      rows.push({ row, cells });
    }
    return rows;
  });

  protected readonly selectedCount = computed(() => this.selectedSeatIds().length);
  protected readonly selectedRows = computed(() => selectedSeatsByRow(this.selectedSeatIds()));

  constructor() {
    effect(() => {
      this.bookingService.getOrCreateForScreening(this.data().screening.id);
    });
  }

  protected onCellClick(cell: CellView): void {
    if (cell.state === 'unavailable') return;
    if (cell.state === 'selected') {
      this.bookingService.removeSeats(cell.ids);
      return;
    }
    if (this.selectedCount() + cell.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.bookingService.addSeats(cell.ids);
  }

  protected cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  protected continue(): void {
    if (this.selectedCount() === 0) return;
    this.router.navigate(['/screenings', this.id(), 'summary']);
  }
}

function cellState(ids: string[], occupied: Set<string>, selected: Set<string>, accessible: boolean): SeatState {
  if (ids.some((id) => occupied.has(id))) return 'unavailable';
  if (ids.every((id) => selected.has(id))) return 'selected';
  if (accessible) return 'accessible';
  return 'available';
}
