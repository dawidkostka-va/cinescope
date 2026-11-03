import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { Api, Screening, parseId } from '../core/api';
import { BookingStore } from '../core/booking';
import { showDate } from '../core/dates';
import { AUDITORIUM, Cell, MAX_SEATS, SeatState, itemLabel } from '../core/seats';
import { ToastService } from '../core/toast';

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly screeningId = parseId(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly rows = AUDITORIUM;
  protected readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  protected readonly screening = signal<Screening | null>(null);
  protected readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${showDate(screening.date, screening.time)}` : '';
  });

  protected readonly seatCount = computed(() => this.booking.seats().length);

  protected readonly rowLines = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of this.booking.items()) {
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), itemLabel(item)]);
    }
    return [...byRow].map(([row, labels]) => ({ row, text: `Row ${row}: ${labels.join(', ')}` }));
  });

  private readonly states = computed(() => {
    const occupied = new Set(this.screening()?.occupiedSeats ?? []);
    const selected = new Set(this.booking.seats());
    const states = new Map<string, SeatState>();
    for (const row of this.rows) {
      for (const cell of row.blocks.flatMap((block) => block ?? [])) {
        let state: SeatState = cell.accessible ? 'accessible' : 'available';
        if (cell.ids.some((id) => occupied.has(id))) {
          state = 'unavailable';
        } else if (cell.ids.some((id) => selected.has(id))) {
          state = 'selected';
        }
        states.set(cell.ids[0], state);
      }
    }
    return states;
  });

  constructor() {
    const id = this.screeningId;
    if (id === null) {
      void this.router.navigateByUrl('/');
      return;
    }
    this.api
      .screening(id)
      .pipe(
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(
            catchError(() => of(null)),
            map(() => screening),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (screening) => {
          this.booking.start(id);
          this.screening.set(screening);
        },
        error: () => void this.router.navigateByUrl('/'),
      });
  }

  protected stateOf(cell: Cell): SeatState {
    return this.states().get(cell.ids[0]) ?? 'available';
  }

  protected toggle(cell: Cell): void {
    const state = this.stateOf(cell);
    if (state === 'unavailable') {
      return;
    }
    const seats = this.booking.seats();
    if (state === 'selected') {
      this.booking.setSeats(seats.filter((id) => !cell.ids.includes(id)));
    } else if (seats.length + cell.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.booking.setSeats([...seats, ...cell.ids]);
    }
  }

  protected cancel(): void {
    this.booking.clear();
    void this.router.navigateByUrl('/');
  }

  protected next(): void {
    if (this.seatCount() > 0) {
      void this.router.navigate(['/screenings', this.screeningId, 'summary']);
    }
  }
}
