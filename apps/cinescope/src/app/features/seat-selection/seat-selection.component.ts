import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { showDate } from '../../core/date-utils';
import { Movie, Screening } from '../../core/models';
import {
  AuditoriumCell,
  MAX_SEATS_PER_BOOKING,
  SEAT_COLORS,
  buildAuditorium,
  groupSelectedByRow,
  seatId,
} from '../../core/seat-utils';
import { ToastService } from '../../core/toast.service';
import { LegendComponent } from './legend.component';

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule, LegendComponent],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.scss',
})
export class SeatSelectionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly booking = this.bookingService.booking;

  protected readonly occupiedSeats = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  protected readonly selectedSeats = computed(() => new Set(this.booking()?.seats ?? []));
  protected readonly auditorium = computed(() => buildAuditorium(this.occupiedSeats(), this.selectedSeats()));

  protected readonly selectedCount = computed(() => this.booking()?.seats.length ?? 0);
  protected readonly selectedRows = computed(() => groupSelectedByRow(this.booking()?.seats ?? []));

  protected readonly showDateText = computed(() => {
    const screening = this.screening();
    return screening ? showDate(screening.date, screening.time) : '';
  });

  constructor() {
    effect(() => {
      const id = this.screeningId();
      this.api.getScreening(id).subscribe({
        next: (screening) => {
          this.screening.set(screening);
          this.bookingService.ensureBookingForScreening(id);
          this.api.getMovie(screening.movieId).subscribe({
            next: (movie) => this.movie.set(movie),
            error: () => this.router.navigateByUrl('/'),
          });
        },
        error: () => this.router.navigateByUrl('/'),
      });
    });
  }

  protected onCellClick(cell: AuditoriumCell): void {
    if (cell.kind !== 'seat' && cell.kind !== 'couch') {
      return;
    }
    if (cell.state === 'unavailable') {
      return;
    }
    const ids = cell.kind === 'couch' ? [seatId(cell.row, cell.columnStart), seatId(cell.row, cell.columnEnd)] : [seatId(cell.row, cell.column)];
    const current = new Set(this.booking()?.seats ?? []);
    const alreadySelected = ids.every((id) => current.has(id));

    if (alreadySelected) {
      ids.forEach((id) => current.delete(id));
    } else {
      if (current.size + ids.length > MAX_SEATS_PER_BOOKING) {
        this.toast.show('Maximum 10 seats per booking');
        return;
      }
      ids.forEach((id) => current.add(id));
    }
    this.bookingService.setSeats([...current]);
  }

  protected seatColor(cell: AuditoriumCell): string {
    return cell.kind === 'seat' || cell.kind === 'couch' ? SEAT_COLORS[cell.state] : '';
  }

  protected cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  protected continue(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }
}
