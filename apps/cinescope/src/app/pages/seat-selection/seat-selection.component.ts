import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { ToastService } from '../../core/toast.service';
import { Movie, Screening } from '../../core/models';
import { showDate } from '../../core/date.util';
import {
  CouchCell,
  SeatCell,
  SeatState,
  STATE_COLORS,
  buildAuditorium,
  cellState,
  summarizeSelection,
} from '../../core/seat-map.util';

const MAX_SEATS = 10;

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.scss',
})
export class SeatSelectionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly screeningId = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))), {
    initialValue: NaN,
  });

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly loaded = signal(false);

  readonly auditorium = buildAuditorium();

  readonly legendItems: { state: SeatState; label: string; color: string }[] = [
    { state: 'available', label: 'Available', color: STATE_COLORS.available },
    { state: 'selected', label: 'Selected', color: STATE_COLORS.selected },
    { state: 'unavailable', label: 'Unavailable', color: STATE_COLORS.unavailable },
    { state: 'accessible', label: 'Accessible', color: STATE_COLORS.accessible },
  ];

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selectedIds = computed(() => new Set(this.bookingService.booking()?.seats ?? []));

  readonly showDateText = computed(() => {
    const screening = this.screening();
    return screening ? showDate(screening.date, screening.time) : '';
  });

  readonly selection = computed(() => summarizeSelection(Array.from(this.selectedIds())));

  constructor() {
    effect(() => {
      const id = this.screeningId();
      if (!id || Number.isNaN(id)) return;
      this.api
        .getScreening(id)
        .pipe(switchMap((screening) => this.api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie })))))
        .subscribe({
          next: ({ screening, movie }) => {
            this.screening.set(screening);
            this.movie.set(movie);
            this.bookingService.ensureBookingForScreening(id);
            this.loaded.set(true);
          },
          error: () => this.router.navigateByUrl('/'),
        });
    });
  }

  state(cell: SeatCell | CouchCell): SeatState {
    return cellState(cell, this.occupied(), this.selectedIds());
  }

  color(cell: SeatCell | CouchCell): string {
    return STATE_COLORS[this.state(cell)];
  }

  onSeatClick(cell: SeatCell): void {
    if (this.state(cell) === 'unavailable') return;
    const result = this.bookingService.toggleIds([cell.id], MAX_SEATS);
    if (result === 'limit') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  onCouchClick(cell: CouchCell): void {
    if (this.state(cell) === 'unavailable') return;
    const result = this.bookingService.toggleIds(cell.ids, MAX_SEATS);
    if (result === 'limit') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  continue(): void {
    if (this.selection().count === 0) return;
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }
}
