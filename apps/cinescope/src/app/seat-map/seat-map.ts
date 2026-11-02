import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { formatShowDate } from '../core/dates';
import { Movie, Screening } from '../core/models';
import { Cell, MAX_SEATS, STATE_COLORS, SeatState, buildRows, selectionByRow } from '../core/seats';
import { ToastService } from '../core/toast.service';

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
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);

  protected readonly legend = LEGEND;
  protected readonly colors = STATE_COLORS;
  protected readonly loaded = signal<{ screening: Screening; movie: Movie } | null>(null);

  protected readonly showDate = computed(() => {
    const screening = this.loaded()?.screening;
    return screening ? formatShowDate(screening.date, screening.time) : '';
  });

  private readonly selected = computed(() => new Set(this.booking.seats()));
  protected readonly rows = computed(() => {
    const screening = this.loaded()?.screening;
    return buildRows(new Set(screening?.occupiedSeats ?? []), this.selected());
  });

  protected readonly seatCount = computed(() => this.booking.seats().length);
  protected readonly rowLines = computed(() => selectionByRow(this.booking.tickets()));

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => params.get('id') ?? ''),
        switchMap((id) =>
          this.api
            .getScreening(id)
            .pipe(
              switchMap((screening) =>
                this.api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
              ),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (data) => {
          if (!this.booking.isInProgressFor(data.screening.id)) {
            this.booking.start(data.screening.id);
          }
          this.loaded.set(data);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected toggle(cell: Cell): void {
    if (cell.state === 'unavailable') return;
    const ids = cell.ticket.ids;
    const current = this.booking.seats();
    if (cell.state === 'selected') {
      this.booking.setSeats(current.filter((id) => !ids.includes(id)));
      return;
    }
    if (current.length + ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.booking.setSeats([...current, ...ids]);
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    const screening = this.loaded()?.screening;
    if (screening && this.seatCount() > 0) {
      this.router.navigate(['/screenings', screening.id, 'summary']);
    }
  }
}
