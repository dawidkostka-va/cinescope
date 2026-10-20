import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { buildAuditorium, CellView } from '../../core/auditorium';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { showDate } from '../../core/date-utils';
import { groupSelectionByRow, MAX_SEATS, seatId } from '../../core/seat-utils';
import { Movie, Screening } from '../../core/models';
import { ToastService } from '../../core/toast.service';

interface RowRender {
  row: number;
  cells: CellView[];
}

const LEGEND = [
  { state: 'available', label: 'Available', color: '#2E7D32' },
  { state: 'selected', label: 'Selected', color: '#F9A825' },
  { state: 'unavailable', label: 'Unavailable', color: '#C62828' },
  { state: 'accessible', label: 'Accessible', color: '#1565C0' },
] as const;

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMapComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly legend = LEGEND;
  readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  readonly loaded = signal(false);
  readonly movie = signal<Movie | null>(null);
  readonly screening = signal<Screening | null>(null);

  readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${showDate(screening.date, screening.time)}` : '';
  });

  readonly selectedSeats = computed(() => {
    const booking = this.bookingService.booking();
    return booking && booking.screeningId === this.screeningId ? booking.seats : [];
  });

  readonly rows = computed<RowRender[]>(() => {
    const screening = this.screening();
    if (!screening) return [];
    const occupied = new Set(screening.occupiedSeats);
    const selected = new Set(this.selectedSeats());
    return buildAuditorium(occupied, selected);
  });

  readonly selectionGroups = computed(() => groupSelectionByRow(this.selectedSeats()));
  readonly selectionCount = computed(() => this.selectedSeats().length);

  constructor() {
    this.api.getScreening(this.screeningId).subscribe({
      next: (screening) => {
        this.api.getMovies().subscribe({
          next: (movies) => {
            const movie = movies.find((m) => m.id === screening.movieId) ?? null;
            this.screening.set(screening);
            this.movie.set(movie);
            this.bookingService.ensureBookingFor(this.screeningId);
            this.loaded.set(true);
          },
          error: () => this.router.navigate(['/']),
        });
      },
      error: () => this.router.navigate(['/']),
    });
  }

  private occupiedSet(): Set<string> {
    return new Set(this.screening()?.occupiedSeats ?? []);
  }

  toggleSeat(row: number, column: number): void {
    const id = seatId(row, column);
    if (this.occupiedSet().has(id)) return;
    const current = this.selectedSeats();
    if (current.includes(id)) {
      this.bookingService.setSeats(current.filter((s) => s !== id));
      return;
    }
    if (current.length + 1 > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.bookingService.setSeats([...current, id]);
  }

  toggleCouch(row: number, columnStart: number, columnEnd: number): void {
    const idA = seatId(row, columnStart);
    const idB = seatId(row, columnEnd);
    const occupied = this.occupiedSet();
    if (occupied.has(idA) || occupied.has(idB)) return;
    const current = this.selectedSeats();
    if (current.includes(idA) || current.includes(idB)) {
      this.bookingService.setSeats(current.filter((s) => s !== idA && s !== idB));
      return;
    }
    if (current.length + 2 > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.bookingService.setSeats([...current, idA, idB]);
  }

  cancel(): void {
    this.bookingService.clear();
    this.router.navigate(['/']);
  }

  continue(): void {
    if (this.selectionCount() === 0) return;
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
