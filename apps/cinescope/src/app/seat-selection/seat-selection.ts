import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Api } from '../core/api';
import { Booking } from '../core/booking';
import { showDate } from '../core/dates';
import { Screening } from '../core/models';
import {
  Cell,
  LAYOUT,
  MAX_SEATS,
  SeatState,
  cellIds,
  cellSize,
  describe,
  isAccessible,
} from '../core/seating';
import { Toast } from '../core/toast';

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly booking = inject(Booking);
  private readonly toast = inject(Toast);

  protected readonly layout = LAYOUT;
  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);
  protected readonly subtitle = computed(() => {
    const s = this.screening();
    return s ? `Show Date: ${showDate(s.date, s.time)}` : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => new Set(this.booking.seats()));

  protected readonly seatCount = computed(() => this.booking.seats().length);
  protected readonly summaryRows = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of this.booking.items()) {
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), describe(item)]);
    }
    return [...byRow.entries()].map(([row, seats]) => ({ row, text: `Row ${row}: ${seats.join(', ')}` }));
  });

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    this.api.screening(id).subscribe({
      next: (screening) => {
        if (!this.booking.isInProgressFor(screening.id)) {
          this.booking.start(screening.id);
        }
        this.screening.set(screening);
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  protected stateOf(cell: Cell): SeatState {
    const ids = cellIds(cell);
    if (ids.some((id) => this.occupied().has(id))) {
      return 'unavailable';
    }
    if (ids.every((id) => this.selected().has(id))) {
      return 'selected';
    }
    return isAccessible(cell) ? 'accessible' : 'available';
  }

  protected toggle(cell: Cell): void {
    const state = this.stateOf(cell);
    if (state === 'unavailable') {
      return;
    }
    const ids = cellIds(cell);
    const seats = this.booking.seats();
    if (state === 'selected') {
      this.booking.setSeats(seats.filter((id) => !ids.includes(id)));
    } else if (seats.length + cellSize(cell) > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.booking.setSeats([...seats, ...ids]);
    }
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    const s = this.screening();
    if (s && this.seatCount() > 0) {
      this.router.navigate(['/screenings', s.id, 'summary']);
    }
  }
}
