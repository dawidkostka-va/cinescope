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
import { map, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { formatShowDate } from '../../core/dates';
import { Movie, Screening, SeatItem } from '../../core/models';
import {
  BlockLayout,
  ROWS,
  SeatState,
  itemLabel,
  itemSize,
  itemState,
  rowLayout,
} from '../../core/seats';
import { ToastService } from '../../core/toast.service';

interface LegendEntry {
  state: SeatState;
  label: string;
}

@Component({
  selector: 'app-seat-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly rows = Array.from({ length: ROWS }, (_, i) => ({
    row: i + 1,
    blocks: rowLayout(i + 1) as BlockLayout[],
  }));

  protected readonly legend: LegendEntry[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));

  protected readonly showDate = computed(() => {
    const s = this.screening();
    return s ? formatShowDate(s.date, s.time) : '';
  });

  protected readonly selected = this.booking.items;
  protected readonly count = this.booking.seatCount;

  protected readonly summaryLines = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of this.selected()) {
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), itemLabel(item)]);
    }
    return [...byRow.entries()].map(([row, labels]) => ({
      row,
      text: `Row ${row}: ${labels.join(', ')}`,
    }));
  });

  constructor() {
    this.api
      .screening(this.route.snapshot.paramMap.get('id') ?? '')
      .pipe(
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          if (!this.booking.inProgressFor(screening.id)) this.booking.start(screening.id);
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected stateOf(item: SeatItem): SeatState {
    return itemState(item, this.selected(), this.occupied());
  }

  protected label(item: SeatItem): string {
    return itemLabel(item);
  }

  protected toggle(item: SeatItem): void {
    const state = this.stateOf(item);
    if (state === 'unavailable') return;
    if (state === 'selected') {
      this.booking.removeItem(item);
      return;
    }
    if (!this.booking.addItem(item)) {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  protected size(item: SeatItem): number {
    return itemSize(item);
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    const s = this.screening();
    if (!s || this.selected().length === 0) return;
    this.router.navigate(['/screenings', s.id, 'summary']);
  }
}
