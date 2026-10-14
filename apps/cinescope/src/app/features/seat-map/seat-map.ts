import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AISLE_1_TRACK,
  AISLE_2_TRACK,
  AuditoriumRowVm,
  CouchCellVm,
  LABEL_LEFT_TRACK,
  LABEL_RIGHT_TRACK,
  SeatCellVm,
  generateAuditorium,
} from '../../core/models/auditorium.model';
import { Screening } from '../../core/models/api.model';
import { toBookingItems } from '../../core/models/seat.model';
import { BookingService } from '../../core/services/booking.service';
import { MoviesApiService } from '../../core/services/movies-api.service';
import { ToastService } from '../../core/services/toast.service';
import { formatShowDate } from '../../core/util/date.util';

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly moviesApi = inject(MoviesApiService);
  protected readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  protected readonly screening = signal<Screening | null>(null);

  protected readonly labelLeftTrack = LABEL_LEFT_TRACK;
  protected readonly aisle1Track = AISLE_1_TRACK;
  protected readonly aisle2Track = AISLE_2_TRACK;
  protected readonly labelRightTrack = LABEL_RIGHT_TRACK;

  protected readonly legendItems = [
    { state: 'available', label: 'Available', color: '#2E7D32' },
    { state: 'selected', label: 'Selected', color: '#F9A825' },
    { state: 'unavailable', label: 'Unavailable', color: '#C62828' },
    { state: 'accessible', label: 'Accessible', color: '#1565C0' },
  ] as const;

  protected readonly auditorium = computed<AuditoriumRowVm[]>(() => {
    const screening = this.screening();
    if (!screening) return [];
    const occupied = new Set(screening.occupiedSeats);
    const selected = new Set(this.bookingService.seats());
    return generateAuditorium(occupied, selected);
  });

  protected readonly selectedCount = computed(() => this.bookingService.seats().length);

  protected readonly selectedLines = computed(() => {
    const items = toBookingItems(this.bookingService.seats());
    const byRow = new Map<number, string[]>();
    for (const item of items) {
      const text = item.isCouch ? `${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`;
      const list = byRow.get(item.row) ?? [];
      list.push(text);
      byRow.set(item.row, list);
    }
    return [...byRow.entries()].sort((a, b) => a[0] - b[0]).map(([row, texts]) => ({ row, text: texts.join(', ') }));
  });

  protected readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${formatShowDate(screening.date, screening.time)}` : '';
  });

  constructor() {
    effect(() => this.load(this.screeningId()));
  }

  protected onSeatClick(cell: SeatCellVm): void {
    this.toggle([cell.id]);
  }

  protected onCouchClick(cell: CouchCellVm): void {
    this.toggle(cell.ids);
  }

  protected cancel(): void {
    this.bookingService.clear();
    this.router.navigate(['/']);
  }

  protected continueToSummary(): void {
    if (this.selectedCount() === 0) return;
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  private toggle(ids: string[]): void {
    const allSelected = ids.every((id) => this.bookingService.isSelected(id));
    if (allSelected) {
      this.bookingService.deselect(ids);
      return;
    }
    if (!this.bookingService.canSelect(ids)) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.bookingService.select(ids);
  }

  private load(id: number): void {
    this.moviesApi.getScreening(id).subscribe({
      next: (screening) => {
        this.screening.set(screening);
        this.bookingService.ensureBookingFor(id);
        this.moviesApi.getMovie(screening.movieId).subscribe({
          error: () => this.redirectHome(),
        });
      },
      error: () => this.redirectHome(),
    });
  }

  private redirectHome(): void {
    this.router.navigate(['/']);
  }
}
