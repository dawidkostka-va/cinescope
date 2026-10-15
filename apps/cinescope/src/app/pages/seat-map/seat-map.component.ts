import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { MoviesService } from '../../core/services/movies.service';
import { ToastService } from '../../core/services/toast.service';
import { Screening } from '../../core/models/screening.model';
import { AuditoriumRow, SeatState, buildAuditorium, cellIds, stateOf } from '../../shared/auditorium';
import { formatShowDate } from '../../shared/date-utils';
import { SeatGroup, groupSeats } from '../../shared/seat-grouping';
import { LEGEND_ITEMS, SEAT_COLORS } from '../../shared/seat-colors';

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.component.html',
  styleUrl: './seat-map.component.scss',
})
export class SeatMapComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly moviesService = inject(MoviesService);
  private readonly bookingService = inject(BookingService);
  private readonly toastService = inject(ToastService);

  private readonly screeningId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: NaN },
  );

  readonly rows: AuditoriumRow[] = buildAuditorium();
  readonly legendItems = LEGEND_ITEMS;

  readonly screening = signal<Screening | null>(null);
  readonly loaded = signal(false);

  readonly booking = this.bookingService.booking;

  readonly occupiedSet = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  readonly selectedSet = computed(() => new Set(this.booking()?.seats ?? []));
  readonly selectedCount = computed(() => this.booking()?.seats.length ?? 0);
  readonly selectedGroups = computed<SeatGroup[]>(() => groupSeats(this.booking()?.seats ?? []));
  readonly selectedRows = computed(() => [...new Set(this.selectedGroups().map((group) => group.row))].sort((a, b) => a - b));

  readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${formatShowDate(screening.date, screening.time)}` : '';
  });

  constructor() {
    effect(() => {
      const id = this.screeningId();
      if (Number.isNaN(id)) {
        this.router.navigateByUrl('/');
        return;
      }
      this.load(id);
    });
  }

  private load(id: number): void {
    this.moviesService.getScreening(id).subscribe({
      next: (screening) => {
        this.bookingService.ensureBookingForScreening(id);
        this.screening.set(screening);
        this.loaded.set(true);
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  seatColor(state: SeatState): string {
    return SEAT_COLORS[state];
  }

  cellState(ids: string[], accessible: boolean): SeatState {
    return stateOf(ids, accessible, this.occupiedSet(), this.selectedSet());
  }

  idsFor(cell: Parameters<typeof cellIds>[0]): string[] {
    return cellIds(cell);
  }

  onSeatClick(ids: string[], state: SeatState): void {
    if (state === 'unavailable') {
      return;
    }
    const result = this.bookingService.toggleSeats(ids);
    if (result === 'limit') {
      this.toastService.show('Maximum 10 seats per booking');
    }
  }

  rowGroupLine(row: number): string {
    const parts = this.selectedGroups()
      .filter((group) => group.row === row)
      .map((group) => (group.kind === 'couch' ? `${group.columnStart}-${group.columnEnd}` : `${group.column}`));
    return `Row ${row}: ${parts.join(', ')}`;
  }

  cancel(): void {
    this.bookingService.clearBooking();
    this.router.navigateByUrl('/');
  }

  continue(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }
}
