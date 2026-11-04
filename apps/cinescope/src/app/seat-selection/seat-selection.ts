import { Component, computed, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, tap } from 'rxjs';
import { BookingService, SelectedUnit } from '../booking.service';
import { CinemaApi } from '../cinema-api';
import { showDate } from '../dates';
import { ToastService } from '../toast/toast.service';
import { buildAuditorium, CouchCell, seatId, SeatCell } from './auditorium';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-selection',
  imports: [MatButton],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly screeningId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { requireSync: true },
  );

  protected readonly rows = buildAuditorium();
  protected readonly legend = LEGEND;
  protected readonly seatCount = this.booking.seatCount;

  protected readonly data = rxResource({
    params: () => this.screeningId(),
    stream: ({ params: id }) =>
      this.api.screeningWithMovie(id).pipe(tap(() => this.booking.open(id))),
  });

  protected readonly view = computed(() => {
    if (this.data.error()) {
      return undefined;
    }
    const value = this.data.value();
    if (!value) {
      return undefined;
    }
    return {
      subtitle: `Show Date: ${showDate(value.screening.date, value.screening.time)}`,
      occupied: new Set(value.screening.occupiedSeats),
    };
  });

  protected readonly selectedRows = computed(() => {
    const units = [...this.booking.units()].sort((a, b) => a.row - b.row || a.column - b.column);
    const labelsByRow = new Map<number, string[]>();
    for (const unit of units) {
      const label = unit.couch ? `${unit.column}-${unit.column + 1}` : `${unit.column}`;
      labelsByRow.set(unit.row, [...(labelsByRow.get(unit.row) ?? []), label]);
    }
    return [...labelsByRow].map(([row, labels]) => ({ row, labels: labels.join(', ') }));
  });

  constructor() {
    effect(() => {
      if (this.data.error()) {
        void this.router.navigate(['/']);
      }
    });
  }

  protected seatState(seat: SeatCell): SeatState {
    const id = seatId(seat.row, seat.column);
    if (this.view()?.occupied.has(id)) {
      return 'unavailable';
    }
    if (this.booking.selectedSeatIds().has(id)) {
      return 'selected';
    }
    return seat.accessible ? 'accessible' : 'available';
  }

  protected couchState(couch: CouchCell): SeatState {
    const occupied = this.view()?.occupied;
    const first = seatId(couch.row, couch.columnStart);
    const second = seatId(couch.row, couch.columnEnd);
    if (occupied?.has(first) || occupied?.has(second)) {
      return 'unavailable';
    }
    return this.booking.selectedSeatIds().has(first) ? 'selected' : 'available';
  }

  protected clickSeat(seat: SeatCell): void {
    if (this.seatState(seat) !== 'unavailable') {
      this.apply({ row: seat.row, column: seat.column, couch: false });
    }
  }

  protected clickCouch(couch: CouchCell): void {
    if (this.couchState(couch) !== 'unavailable') {
      this.apply({ row: couch.row, column: couch.columnStart, couch: true });
    }
  }

  protected cancel(): void {
    this.booking.clear();
    void this.router.navigate(['/']);
  }

  protected continueToSummary(): void {
    if (this.booking.seatCount() > 0) {
      void this.router.navigate(['/screenings', this.screeningId(), 'summary']);
    }
  }

  private apply(unit: SelectedUnit): void {
    if (this.booking.toggle(unit) === 'limit') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }
}
