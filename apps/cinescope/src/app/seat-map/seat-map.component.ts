import { Component, computed, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AUDITORIUM, Cell, cellIds, cellLabel, compareCells } from '../core/auditorium';
import { BookingService } from '../core/booking.service';
import { showDate } from '../core/dates';
import { Screening } from '../core/models';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-map',
  imports: [NgTemplateOutlet, MatButtonModule],
  templateUrl: './seat-map.component.html',
  styleUrl: './seat-map.component.scss',
})
export class SeatMapComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  readonly booking = inject(BookingService);

  readonly rows = AUDITORIUM;
  readonly legend = LEGEND;

  readonly data = resource({
    params: () => Number(this.params().get('id')),
    loader: async ({ params: id }) => {
      try {
        const screening = await firstValueFrom(this.api.screening(id));
        await firstValueFrom(this.api.movie(screening.movieId));
        this.booking.begin(id);
        return { screening, occupied: new Set(screening.occupiedSeats) };
      } catch {
        await this.router.navigate(['/']);
        return undefined;
      }
    },
  });

  readonly selectedRows = computed(() => {
    const byRow = new Map<number, Cell[]>();
    for (const cell of [...this.booking.seats()].sort(compareCells)) {
      byRow.set(cell.row, [...(byRow.get(cell.row) ?? []), cell]);
    }
    return [...byRow].map(([row, cells]) => ({ row, text: cells.map(cellLabel).join(', ') }));
  });

  dateLabel(screening: Screening): string {
    return showDate(screening.date, screening.time);
  }

  stateOf(cell: Cell, occupied: Set<string>): SeatState {
    if (cellIds(cell).some((id) => occupied.has(id))) {
      return 'unavailable';
    }
    if (this.booking.isSelected(cell)) {
      return 'selected';
    }
    return cell.kind === 'seat' && cell.accessible ? 'accessible' : 'available';
  }

  onCellClick(cell: Cell, occupied: Set<string>): void {
    if (this.stateOf(cell, occupied) !== 'unavailable') {
      this.booking.toggle(cell);
    }
  }

  cancel(): void {
    this.booking.clear();
    this.router.navigate(['/']);
  }

  continue(): void {
    if (this.booking.seatCount() > 0) {
      this.router.navigate(['/screenings', this.params().get('id'), 'summary']);
    }
  }
}
