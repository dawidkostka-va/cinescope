import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../core/booking.service';
import { formatShowDate } from '../../core/date.util';
import { injectResolvedScreening } from '../../core/screening-resolver';
import { SeatState, isAccessibleSeat, seatId, seatUnitLabel, toSeatUnits } from '../../core/seat.util';
import { buildSeatMapRows } from './seat-map.vm';

const COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

const LEGEND_ITEMS: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.component.html',
  styleUrl: './seat-map.component.scss',
})
export class SeatMapComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly legendItems = LEGEND_ITEMS;
  readonly rows = buildSeatMapRows();

  private readonly data = injectResolvedScreening();

  readonly screening = computed(() => this.data().screening);
  readonly movie = computed(() => this.data().movie);
  readonly subtitle = computed(() => `Show Date: ${formatShowDate(this.screening().date, this.screening().time)}`);

  private readonly occupiedSet = computed(() => new Set(this.screening().occupiedSeats));
  private readonly booking = this.bookingService.booking;
  private readonly selectedSet = computed(() => new Set(this.booking()?.seats ?? []));

  readonly selectedCount = computed(() => this.booking()?.seats.length ?? 0);
  readonly selectedByRow = computed(() => {
    const units = toSeatUnits(this.booking()?.seats ?? []);
    const rows: { row: number; seats: string }[] = [];
    for (const unit of units) {
      const label = seatUnitLabel(unit);
      const last = rows[rows.length - 1];
      if (last && last.row === unit.row) {
        last.seats = `${last.seats}, ${label}`;
      } else {
        rows.push({ row: unit.row, seats: label });
      }
    }
    return rows;
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.bookingService.ensureBookingFor(id);
  }

  seatState(row: number, column: number): SeatState {
    const id = seatId(row, column);
    if (this.occupiedSet().has(id)) return 'unavailable';
    if (this.selectedSet().has(id)) return 'selected';
    if (isAccessibleSeat(row, column)) return 'accessible';
    return 'available';
  }

  couchState(row: number, columnStart: number, columnEnd: number): SeatState {
    const idA = seatId(row, columnStart);
    const idB = seatId(row, columnEnd);
    if (this.occupiedSet().has(idA) || this.occupiedSet().has(idB)) return 'unavailable';
    if (this.selectedSet().has(idA) || this.selectedSet().has(idB)) return 'selected';
    return 'available';
  }

  colorFor(state: SeatState): string {
    return COLORS[state];
  }

  onSeatClick(row: number, column: number): void {
    if (this.seatState(row, column) === 'unavailable') return;
    this.bookingService.toggleSeat(seatId(row, column));
  }

  onCouchClick(row: number, columnStart: number, columnEnd: number): void {
    if (this.couchState(row, columnStart, columnEnd) === 'unavailable') return;
    this.bookingService.toggleCouch(row, columnStart, columnEnd);
  }

  cancel(): void {
    this.bookingService.clear();
    this.router.navigate(['/']);
  }

  continue(): void {
    if (this.selectedCount() === 0) return;
    this.router.navigate(['/screenings', this.screening().id, 'summary']);
  }
}
