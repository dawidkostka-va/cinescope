import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { CinemaApi, Movie, Screening } from '../core/api';
import { BookingService, emptyForm } from '../core/booking';
import { showDate } from '../core/format';
import { MAX_SEATS, groupIntoUnits, unitLabel } from '../core/seats';
import { ToastService } from '../core/toast';
import { AUDITORIUM, Bookable } from './auditorium';

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
  templateUrl: './seat-map.component.html',
  styleUrl: './seat-map.component.scss',
})
export class SeatMapComponent {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly layout = AUDITORIUM;
  protected readonly legend = LEGEND;
  protected readonly maxSeats = MAX_SEATS;

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  private readonly id = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))), {
    requireSync: true,
  });

  protected readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? showDate(screening.date, screening.time) : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => this.bookingService.booking()?.seats ?? []);
  protected readonly selectedCount = computed(() => this.selected().length);
  protected readonly panelRows = computed(() => {
    const rows = new Map<number, string[]>();
    for (const unit of groupIntoUnits(this.selected())) {
      rows.set(unit.row, [...(rows.get(unit.row) ?? []), unitLabel(unit)]);
    }
    return [...rows].map(([row, labels]) => ({ row, text: labels.join(', ') }));
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.api.screening(id).pipe(
            switchMap((screening) =>
              this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
            ),
            catchError(() => {
              void this.router.navigate(['/']);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ screening, movie }) => this.open(screening, movie));
  }

  protected gridColumn(track: number, span = 1): string {
    return `${track} / span ${span}`;
  }

  protected stateOf(cell: Bookable): SeatState {
    if (cell.kind === 'seat') {
      return this.stateFor([cell.id], cell.accessible);
    }
    return this.stateFor(cell.ids, false);
  }

  protected onCellClick(cell: Bookable): void {
    const ids = cell.kind === 'seat' ? [cell.id] : cell.ids;
    if (ids.some((id) => this.occupied().has(id))) {
      return;
    }
    const booking = this.bookingService.booking();
    if (!booking) {
      return;
    }
    if (ids.some((id) => booking.seats.includes(id))) {
      this.saveSeats(booking.seats.filter((id) => !ids.includes(id)));
      return;
    }
    if (booking.seats.length + ids.length > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    }
    this.saveSeats([...booking.seats, ...ids]);
  }

  protected cancel(): void {
    this.bookingService.clear();
    void this.router.navigate(['/']);
  }

  protected continue(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    void this.router.navigate(['/screenings', this.id(), 'summary']);
  }

  private stateFor(ids: string[], accessible: boolean): SeatState {
    if (ids.some((id) => this.occupied().has(id))) {
      return 'unavailable';
    }
    if (ids.some((id) => this.selected().includes(id))) {
      return 'selected';
    }
    return accessible ? 'accessible' : 'available';
  }

  private saveSeats(seats: string[]): void {
    const booking = this.bookingService.booking();
    if (booking) {
      this.bookingService.save({ ...booking, seats });
    }
  }

  private open(screening: Screening, movie: Movie): void {
    const current = this.bookingService.booking();
    if (!current || current.paidEmail !== null || current.screeningId !== screening.id) {
      this.bookingService.save({ screeningId: screening.id, seats: [], form: emptyForm(), paidEmail: null });
    }
    this.screening.set(screening);
    this.movie.set(movie);
  }
}
