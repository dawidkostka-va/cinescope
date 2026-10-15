import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { formatShowDate } from '../../core/date.util';
import { Movie, Screening } from '../../core/models';
import { formatPrice, priceForRow } from '../../core/pricing.util';
import { groupSelection, seatDescription, seatId, SelectionRow } from '../../core/selection.util';
import { buildRowCells, SeatCell, TOTAL_ROWS } from '../../core/seat-map.util';
import { ToastService } from '../../core/toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface RenderCell {
  cell: SeatCell;
  state?: SeatState;
  ids?: string[];
}

interface RenderRow {
  row: number;
  cells: RenderCell[];
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection implements OnInit {
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @Input() id = '';

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly booking = this.bookingService.booking;

  readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${formatShowDate(screening.date, screening.time)}` : '';
  });

  readonly selectedIds = computed(() => new Set(this.booking()?.seats ?? []));
  readonly occupiedIds = computed(() => new Set(this.screening()?.occupiedSeats ?? []));

  readonly rows = computed<RenderRow[]>(() => {
    const occupied = this.occupiedIds();
    const selected = this.selectedIds();
    const result: RenderRow[] = [];
    for (let row = 1; row <= TOTAL_ROWS; row++) {
      const cells = buildRowCells(row).map((cell): RenderCell => {
        if (cell.kind === 'seat') {
          const id = seatId(row, cell.column);
          const state: SeatState = occupied.has(id) ? 'unavailable' : selected.has(id) ? 'selected' : cell.accessible ? 'accessible' : 'available';
          return { cell, state, ids: [id] };
        }
        if (cell.kind === 'couch') {
          const idA = seatId(row, cell.columnStart);
          const idB = seatId(row, cell.columnEnd);
          const state: SeatState = occupied.has(idA) || occupied.has(idB) ? 'unavailable' : selected.has(idA) ? 'selected' : 'available';
          return { cell, state, ids: [idA, idB] };
        }
        return { cell };
      });
      result.push({ row, cells });
    }
    return result;
  });

  readonly selectionRows = computed(() => groupSelection(this.booking()?.seats ?? []));
  readonly selectedCount = computed(() => this.booking()?.seats.length ?? 0);

  readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  ngOnInit(): void {
    const screeningId = Number(this.id);
    this.api.getScreening(screeningId).subscribe({
      next: (screening) => {
        this.api.getMovie(screening.movieId).subscribe({
          next: (movie) => {
            this.screening.set(screening);
            this.movie.set(movie);
            this.bookingService.ensureBooking(screeningId);
          },
          error: () => this.router.navigateByUrl('/'),
        });
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  seatDescription = seatDescription;

  priceLabel(row: number): string {
    return formatPrice(priceForRow(row));
  }

  rowSummary(selectionRow: SelectionRow): string {
    return selectionRow.items.map((item) => seatDescription(item)).join(', ');
  }

  colorFor(state: SeatState | undefined): string {
    switch (state) {
      case 'selected':
        return '#F9A825';
      case 'unavailable':
        return '#C62828';
      case 'accessible':
        return '#1565C0';
      default:
        return '#2E7D32';
    }
  }

  onCellClick(cell: RenderCell): void {
    if (!cell.ids || cell.state === 'unavailable') {
      return;
    }
    const result = this.bookingService.toggleSeat(cell.ids);
    if (result === 'limit') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  continue(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    this.router.navigateByUrl(`/screenings/${this.id}/summary`);
  }
}
