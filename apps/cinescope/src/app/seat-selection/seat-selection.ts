import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { BookingService } from '../booking';
import { CinemaApi } from '../cinema-api';
import { showDate } from '../dates';
import { Screening } from '../models';
import { buildAuditorium, Cell, seatsIn } from '../seat-map/auditorium';
import { ToastService } from '../toast/toast';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

const MAX_SEATS = 10;

interface RowLine {
  row: number;
  text: string;
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelectionComponent {
  private readonly api = inject(CinemaApi);
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  private readonly selectedKeys = signal<ReadonlySet<string>>(new Set());

  protected readonly data = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) =>
        this.api.screeningWithMovie(Number(params.get('id'))).pipe(
          tap(({ screening }) => this.openBooking(screening.id)),
          catchError(() => {
            this.router.navigateByUrl('/');
            return EMPTY;
          }),
        ),
      ),
    ),
  );

  protected readonly rows = computed(() => {
    const screening = this.data()?.screening;
    return screening ? buildAuditorium(new Set(screening.occupiedSeats)) : [];
  });

  private readonly selectedCells = computed(() => {
    const keys = this.selectedKeys();
    return this.rows()
      .flatMap((row) => row.segments)
      .flatMap((segment) => (segment.kind === 'block' ? segment.cells : []))
      .filter((cell) => keys.has(cell.key));
  });

  protected readonly seatCount = computed(() =>
    this.selectedCells().reduce((total, cell) => total + seatsIn(cell), 0),
  );

  protected readonly rowLines = computed<RowLine[]>(() => {
    const labelsByRow = new Map<number, string[]>();
    for (const cell of this.selectedCells()) {
      const label = cell.kind === 'seat' ? `${cell.column}` : `${cell.start}-${cell.end}`;
      labelsByRow.set(cell.row, [...(labelsByRow.get(cell.row) ?? []), label]);
    }
    return [...labelsByRow].map(([row, labels]) => ({ row, text: labels.join(', ') }));
  });

  protected subtitle(screening: Screening): string {
    return showDate(screening.date, screening.time);
  }

  protected stateOf(cell: Cell): SeatState {
    if (cell.occupied) {
      return 'unavailable';
    }
    if (this.selectedKeys().has(cell.key)) {
      return 'selected';
    }
    return cell.kind === 'seat' && cell.accessible ? 'accessible' : 'available';
  }

  protected toggle(cell: Cell): void {
    if (cell.occupied) {
      return;
    }
    const keys = new Set(this.selectedKeys());
    if (keys.has(cell.key)) {
      keys.delete(cell.key);
    } else if (this.seatCount() + seatsIn(cell) > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    } else {
      keys.add(cell.key);
    }
    this.selectedKeys.set(keys);
    this.persistSelection(keys);
  }

  protected cancel(): void {
    this.bookings.clear();
    this.selectedKeys.set(new Set());
    this.router.navigateByUrl('/');
  }

  protected continue(screeningId: number): void {
    if (this.seatCount() > 0) {
      this.router.navigate(['/screenings', screeningId, 'summary']);
    }
  }

  private openBooking(screeningId: number): void {
    const current = this.bookings.get();
    if (current && current.screeningId === screeningId && current.paidEmail === undefined) {
      this.selectedKeys.set(new Set(current.selection));
      return;
    }
    this.bookings.save({ screeningId, selection: [] });
    this.selectedKeys.set(new Set());
  }

  private persistSelection(keys: ReadonlySet<string>): void {
    const booking = this.bookings.get();
    if (booking) {
      this.bookings.save({ ...booking, selection: [...keys] });
    }
  }
}
