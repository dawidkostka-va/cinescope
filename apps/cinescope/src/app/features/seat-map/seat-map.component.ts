import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Data, Router } from '@angular/router';
import {
  AISLE_GRID_COLUMNS,
  AUDITORIUM_ROWS,
  AuditoriumCell,
  LABEL_LEFT_GRID_COLUMN,
  LABEL_RIGHT_GRID_COLUMN,
} from '../../core/auditorium-layout';
import { BookingService } from '../../core/booking.service';
import { formatShowDate } from '../../core/date-utils';
import { ScreeningData } from '../../core/screening-resolver';
import { MAX_SEATS_PER_BOOKING, SeatState, groupBookingSeats, seatId } from '../../core/seats';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.component.html',
  styleUrl: './seat-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeatMapComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly routeData = toSignal(this.route.data, { requireSync: true }) as () => Data;

  protected readonly screening = computed(() => (this.routeData()['data'] as ScreeningData).screening);
  protected readonly movie = computed(() => (this.routeData()['data'] as ScreeningData).movie);
  protected readonly showDate = computed(() => formatShowDate(this.screening().date, this.screening().time));

  protected readonly legend: Array<{ state: SeatState; label: string }> = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  protected readonly rows = AUDITORIUM_ROWS;
  protected readonly aisleColumns = AISLE_GRID_COLUMNS;
  protected readonly labelLeftColumn = LABEL_LEFT_GRID_COLUMN;
  protected readonly labelRightColumn = LABEL_RIGHT_GRID_COLUMN;

  protected readonly occupied = computed(() => new Set(this.screening().occupiedSeats));
  protected readonly selected = computed(() => new Set(this.booking.booking()?.seats ?? []));
  protected readonly selectedCount = computed(() => this.selected().size);

  protected readonly selectedRowLines = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of groupBookingSeats([...this.selected()])) {
      const text = item.kind === 'couch' ? `${item.columnStart}-${item.columnEnd}` : `${item.column}`;
      const list = byRow.get(item.row);
      if (list) list.push(text);
      else byRow.set(item.row, [text]);
    }
    return [...byRow.entries()].map(([row, seats]) => ({ row, text: seats.join(', ') }));
  });

  constructor() {
    effect(() => {
      this.booking.ensureBooking(this.screening().id);
    });
  }

  private idsForCell(cell: AuditoriumCell): string[] {
    return cell.kind === 'couch'
      ? [seatId(cell.row, cell.columnStart), seatId(cell.row, cell.columnEnd)]
      : [seatId(cell.row, cell.column)];
  }

  protected stateFor(cell: AuditoriumCell): SeatState {
    const ids = this.idsForCell(cell);
    if (ids.some((id) => this.occupied().has(id))) return 'unavailable';
    if (ids.every((id) => this.selected().has(id))) return 'selected';
    return cell.kind === 'accessible' ? 'accessible' : 'available';
  }

  protected gridColumnFor(cell: AuditoriumCell): string {
    return cell.kind === 'couch' ? `${cell.gridColumn} / span 2` : `${cell.gridColumn}`;
  }

  protected labelFor(cell: AuditoriumCell): string {
    return cell.kind === 'couch' ? `${cell.columnStart}-${cell.columnEnd}` : `${cell.column}`;
  }

  protected onCellClick(cell: AuditoriumCell): void {
    const ids = this.idsForCell(cell);
    if (ids.some((id) => this.occupied().has(id))) return;

    const selected = this.selected();
    if (ids.every((id) => selected.has(id))) {
      this.booking.removeSeats(ids);
      return;
    }

    if (this.booking.seatCount() + ids.length > MAX_SEATS_PER_BOOKING) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.booking.addSeats(ids);
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected continue(): void {
    if (this.selectedCount() === 0) return;
    this.router.navigate(['/screenings', this.screening().id, 'summary']);
  }
}
