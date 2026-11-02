import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, map, switchMap, tap } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService } from '../booking/booking.service';
import { showDate } from '../date';
import { Screening } from '../models';
import { Cell, cellIds, cellKey, firstColumn } from '../seat-map/auditorium';
import { SeatMap } from '../seat-map/seat-map';
import { ToastService } from '../toast/toast';

interface SelectedRow {
  row: number;
  label: string;
}

const MAX_SEATS = 10;

function seatsOf(cell: Cell): number {
  return cell.kind === 'couch' ? 2 : 1;
}

function cellLabel(cell: Cell): string {
  return cell.kind === 'seat' ? String(cell.column) : `${cell.start}-${cell.end}`;
}

@Component({
  selector: 'app-seat-selection',
  imports: [SeatMap, MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);

  readonly loaded = toSignal(
    this.route.paramMap.pipe(
      map((params) => Number(params.get('id'))),
      switchMap((id) =>
        this.api.getScreeningDetails(id).pipe(
          tap(() => this.booking.startOrResume(id)),
          catchError(() => {
            void this.router.navigate(['/']);
            return EMPTY;
          }),
        ),
      ),
    ),
    { initialValue: null },
  );

  readonly occupied = computed(() => new Set(this.loaded()?.screening.occupiedSeats ?? []));

  readonly selection = this.booking.cells;
  readonly selectedKeys = computed(() => new Set(this.selection().map(cellKey)));
  readonly seatCount = computed(() => this.selection().reduce((total, cell) => total + seatsOf(cell), 0));

  readonly selectedRows = computed<SelectedRow[]>(() => {
    const byRow = new Map<number, Cell[]>();
    for (const cell of this.selection()) {
      byRow.set(cell.row, [...(byRow.get(cell.row) ?? []), cell]);
    }
    return [...byRow.entries()]
      .sort(([a], [b]) => a - b)
      .map(([row, cells]) => ({
        row,
        label: cells
          .sort((a, b) => firstColumn(a) - firstColumn(b))
          .map(cellLabel)
          .join(', '),
      }));
  });

  protected dateLabel(screening: Screening): string {
    return showDate(screening.date, screening.time);
  }

  protected toggle(cell: Cell): void {
    const key = cellKey(cell);
    const current = this.selection();
    if (this.selectedKeys().has(key)) {
      this.booking.setCells(current.filter((c) => cellKey(c) !== key));
      return;
    }
    if (cellIds(cell).some((id) => this.occupied().has(id))) return;
    if (this.seatCount() + seatsOf(cell) > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    }
    this.booking.setCells([...current, cell]);
  }

  protected cancel(): void {
    this.booking.clear();
    void this.router.navigate(['/']);
  }

  protected proceed(): void {
    const id = this.loaded()?.screening.id;
    if (this.seatCount() === 0 || id === undefined) return;
    void this.router.navigate(['/screenings', id, 'summary']);
  }
}
