import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { formatShowDate } from '../../core/dates';
import { Screening } from '../../core/models';
import { COUCH_ROW, MAX_SEATS, ROWS, seatId, toItems } from '../../core/seats';
import { ToastService } from '../../core/toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface SeatView {
  key: string;
  couch: boolean;
  row: number;
  column: number;
  columnEnd: number;
  ids: string[];
  state: SeatState;
  gridColumn: string;
}

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

const gridColumn = (column: number) => (column <= 4 ? column + 1 : column <= 20 ? column + 2 : column + 3);

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly bookingService = inject(BookingService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);

  protected readonly showDate = computed(() => {
    const s = this.screening();
    return s ? formatShowDate(s.date, s.time) : '';
  });

  private readonly selected = computed(() => this.bookingService.booking()?.seats ?? []);

  protected readonly rows = computed(() => {
    const occupied = new Set(this.screening()?.occupiedSeats ?? []);
    const selected = new Set(this.selected());
    const stateOf = (row: number, ids: string[], couch: boolean): SeatState => {
      if (ids.some((id) => occupied.has(id))) return 'unavailable';
      if (ids.every((id) => selected.has(id))) return 'selected';
      return !couch && this.isAccessible(row, ids[0]) ? 'accessible' : 'available';
    };
    return Array.from({ length: ROWS }, (_, i) => {
      const row = i + 1;
      const items: SeatView[] = [];
      if (row === COUCH_ROW) {
        for (let start = 1; start <= 23; start += 2) {
          const ids = [seatId(row, start), seatId(row, start + 1)];
          items.push({
            key: ids[0],
            couch: true,
            row,
            column: start,
            columnEnd: start + 1,
            ids,
            state: stateOf(row, ids, true),
            gridColumn: `${gridColumn(start)} / span 2`,
          });
        }
      } else {
        for (let column = row <= 10 ? 5 : 1; column <= 24; column++) {
          const ids = [seatId(row, column)];
          items.push({
            key: ids[0],
            couch: false,
            row,
            column,
            columnEnd: column,
            ids,
            state: stateOf(row, ids, false),
            gridColumn: `${gridColumn(column)}`,
          });
        }
      }
      return { row, items };
    });
  });

  protected readonly count = computed(() => this.selected().length);

  protected readonly selectedRows = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of toItems(this.selected())) {
      const text = item.couch ? `${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`;
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), text]);
    }
    return [...byRow].map(([row, parts]) => ({ row, text: parts.join(', ') }));
  });

  constructor() {
    this.api
      .screening(this.screeningId)
      .pipe(
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(
            catchError(() => of(null)),
            map(() => screening),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (screening) => {
          this.bookingService.startFor(screening.id);
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  private isAccessible(row: number, id: string): boolean {
    const column = Number(id.slice(id.indexOf('C') + 1));
    return row === 1 && column >= 10 && column <= 15;
  }

  protected toggle(seat: SeatView) {
    if (seat.state === 'unavailable') return;
    const current = this.selected();
    if (seat.state === 'selected') {
      this.bookingService.setSeats(current.filter((id) => !seat.ids.includes(id)));
    } else if (current.length + seat.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.bookingService.setSeats([...current, ...seat.ids]);
    }
  }

  protected cancel() {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  protected next() {
    if (this.count() === 0) return;
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
