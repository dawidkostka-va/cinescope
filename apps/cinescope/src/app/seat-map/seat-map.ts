import { Component, computed, inject, input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import {
  AUDITORIUM,
  Cell,
  isSameSelection,
  seatIds,
  seatCount,
  seatLabel,
  sortSelections,
  toSelection,
} from '../auditorium';
import { BookingService } from '../booking.service';
import { showDate } from '../dates';
import { ScreeningView } from '../models';
import { ToastService } from '../toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

const LEGEND: { state: SeatState; label: string }[] = [
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
export class SeatMap implements OnInit {
  readonly view = input.required<ScreeningView>();

  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly rows = AUDITORIUM;
  protected readonly legend = LEGEND;

  protected readonly subtitle = computed(() => {
    const { screening } = this.view();
    return `Show Date: ${showDate(screening.date, screening.time)}`;
  });

  private readonly occupied = computed(() => new Set(this.view().screening.occupiedSeats));
  protected readonly selections = computed(() => this.booking.current()?.selections ?? []);
  protected readonly count = computed(() => seatCount(this.selections()));

  protected readonly selectedRows = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const selection of sortSelections(this.selections())) {
      byRow.set(selection.row, [...(byRow.get(selection.row) ?? []), seatLabel(selection)]);
    }
    return [...byRow].map(([row, seats]) => ({ row, text: seats.join(', ') }));
  });

  ngOnInit(): void {
    this.booking.startOrKeep(this.view().screening.id);
  }

  protected stateOf(cell: Cell): SeatState {
    const selection = toSelection(cell);
    if (seatIds(selection).some((id) => this.occupied().has(id))) {
      return 'unavailable';
    }
    if (this.selections().some((s) => isSameSelection(s, selection))) {
      return 'selected';
    }
    return cell.accessible ? 'accessible' : 'available';
  }

  protected toggle(cell: Cell): void {
    if (this.stateOf(cell) === 'unavailable') {
      return;
    }
    if (!this.booking.toggleSelection(toSelection(cell))) {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigate(['/']);
  }

  protected proceed(): void {
    if (this.count() === 0) {
      return;
    }
    this.router.navigate(['/screenings', this.view().screening.id, 'summary']);
  }
}
