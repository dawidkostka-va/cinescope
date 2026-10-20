import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Screening } from '../../models/screening.model';
import { ApiService } from '../../services/api.service';
import { BookingService } from '../../services/booking.service';
import { ToastService } from '../../services/toast.service';
import { formatShowDate } from '../../utils/date.util';
import { seatId } from '../../utils/seat.util';
import { groupIntoUnits } from '../../utils/selection.util';
import { buildAuditoriumRows, SeatCell, SeatRow } from './seat-layout';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

const STATE_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

interface SelectedRowLine {
  row: number;
  label: string;
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  readonly rows: SeatRow[] = buildAuditoriumRows();
  readonly screening = signal<Screening | null>(null);

  private readonly occupied = computed<Set<string>>(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed<Set<string>>(() => new Set(this.bookingService.booking()?.seats ?? []));

  readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${formatShowDate(screening.date, screening.time)}` : '';
  });

  readonly legendItems: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  readonly selectedCount = computed(() => this.bookingService.booking()?.seats.length ?? 0);

  readonly selectedRowLines = computed<SelectedRowLine[]>(() => {
    const units = groupIntoUnits(this.bookingService.booking()?.seats ?? []);
    const byRow = new Map<number, string[]>();
    for (const unit of units) {
      const label = unit.isCouch ? `${unit.columns[0]}-${unit.columns[1]}` : `${unit.columns[0]}`;
      const entries = byRow.get(unit.row) ?? [];
      entries.push(label);
      byRow.set(unit.row, entries);
    }
    return Array.from(byRow.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([row, labels]) => ({ row, label: labels.join(', ') }));
  });

  readonly canContinue = computed(() => this.selectedCount() > 0);

  constructor() {
    this.api.getScreening(this.screeningId).subscribe({
      next: (screening) => {
        this.screening.set(screening);
        this.bookingService.ensureBookingForScreening(this.screeningId);
      },
      error: () => {
        this.router.navigateByUrl('/');
      },
    });
  }

  seatState(row: number, cell: Extract<SeatCell, { kind: 'seat' }>): SeatState {
    const id = seatId(row, cell.column);
    if (this.occupied().has(id)) return 'unavailable';
    if (this.selected().has(id)) return 'selected';
    if (cell.accessible) return 'accessible';
    return 'available';
  }

  couchState(row: number, cell: Extract<SeatCell, { kind: 'couch' }>): SeatState {
    const idA = seatId(row, cell.start);
    const idB = seatId(row, cell.end);
    if (this.occupied().has(idA) || this.occupied().has(idB)) return 'unavailable';
    if (this.selected().has(idA)) return 'selected';
    return 'available';
  }

  stateColor(state: SeatState): string {
    return STATE_COLORS[state];
  }

  onSeatClick(row: number, cell: Extract<SeatCell, { kind: 'seat' }>): void {
    if (this.seatState(row, cell) === 'unavailable') return;
    this.toggle([seatId(row, cell.column)]);
  }

  onCouchClick(row: number, cell: Extract<SeatCell, { kind: 'couch' }>): void {
    if (this.couchState(row, cell) === 'unavailable') return;
    this.toggle([seatId(row, cell.start), seatId(row, cell.end)]);
  }

  private toggle(ids: string[]): void {
    const ok = this.bookingService.toggleUnit(ids);
    if (!ok) {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  continue(): void {
    if (!this.canContinue()) return;
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
