import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { map, switchMap } from 'rxjs/operators';
import { BookingStore } from '../booking/booking.store';
import { ticketsFor } from '../booking/tickets';
import { CinemaApi } from '../cinema.api';
import { showDate } from '../dates';
import { Movie, Screening } from '../models';
import { Toast } from '../toast/toast';
import { AuditoriumItem, buildAuditorium } from './auditorium';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const STATE_COLOURS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeatMap {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly booking = inject(BookingStore);
  private readonly toast = inject(Toast);

  readonly rows = buildAuditorium();
  readonly legend = LEGEND;
  readonly colours = STATE_COLOURS;

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);

  readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? showDate(screening.date, screening.time) : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));

  readonly selectedIds = computed(() => {
    const screening = this.screening();
    return screening ? this.booking.selectedFor(screening.id) : [];
  });

  private readonly selected = computed(() => new Set(this.selectedIds()));

  readonly selectionRows = computed(() => {
    const rows = new Map<number, string[]>();
    for (const ticket of ticketsFor(this.selectedIds())) {
      rows.set(ticket.row, [...(rows.get(ticket.row) ?? []), ticket.columnsLabel]);
    }
    return [...rows].map(([row, labels]) => ({ row, text: labels.join(', ') }));
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.api.screening(Number(params.get('id')))),
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
          this.booking.start(screening.id);
        },
        error: () => void this.router.navigateByUrl('/'),
      });
  }

  stateOf(item: AuditoriumItem): SeatState {
    if (item.kind === 'couch') {
      if (this.isOccupied(item.ids[0]) || this.isOccupied(item.ids[1])) {
        return 'unavailable';
      }
      return this.selected().has(item.ids[0]) ? 'selected' : 'available';
    }
    if (this.isOccupied(item.id)) {
      return 'unavailable';
    }
    if (this.selected().has(item.id)) {
      return 'selected';
    }
    return item.accessible ? 'accessible' : 'available';
  }

  select(item: AuditoriumItem): void {
    const screening = this.screening();
    if (!screening || this.stateOf(item) === 'unavailable') {
      return;
    }
    const ids = item.kind === 'couch' ? item.ids : [item.id];
    if (this.booking.toggle(screening.id, ids) === 'limit') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  cancel(): void {
    this.booking.clear();
    void this.router.navigateByUrl('/');
  }

  continueToSummary(): void {
    const screening = this.screening();
    if (!screening || this.selectedIds().length === 0) {
      return;
    }
    void this.router.navigateByUrl(`/screenings/${screening.id}/summary`);
  }

  private isOccupied(id: string): boolean {
    return this.occupied().has(id);
  }
}
