import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../api.service';
import { BookingService } from '../booking.service';
import { showDate } from '../dates';
import { Screening } from '../models';
import { COUCH_ROW, MAX_SEATS, buildItems, describeItem, seatId } from '../seat-utils';
import { Toast } from '../toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface Cell {
  kind: 'seat' | 'couch' | 'aisle' | 'entrance';
  col: number;
  colEnd: number;
  gridColumn: string;
}

interface RowModel {
  row: number;
  cells: Cell[];
}

const gridCol = (c: number) => (c <= 4 ? c + 1 : c <= 20 ? c + 2 : c + 3);

function buildRows(): RowModel[] {
  const rows: RowModel[] = [];
  for (let row = 1; row <= 15; row++) {
    const cells: Cell[] = [];
    if (row <= 10) cells.push({ kind: 'entrance', col: 0, colEnd: 0, gridColumn: '2 / 6' });
    const seatCell = (col: number): Cell =>
      row === COUCH_ROW
        ? { kind: 'couch', col, colEnd: col + 1, gridColumn: `${gridCol(col)} / span 2` }
        : { kind: 'seat', col, colEnd: col, gridColumn: String(gridCol(col)) };
    const step = row === COUCH_ROW ? 2 : 1;
    const block = (from: number, to: number) => {
      for (let c = from; c <= to; c += step) cells.push(seatCell(c));
    };
    if (row > 10) block(1, 4);
    cells.push({ kind: 'aisle', col: 0, colEnd: 0, gridColumn: '6' });
    block(5, 20);
    cells.push({ kind: 'aisle', col: 0, colEnd: 0, gridColumn: '23' });
    block(21, 24);
    rows.push({ row, cells });
  }
  return rows;
}

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(Toast);

  protected readonly rows = buildRows();
  protected readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  private readonly screening = signal<Screening | null>(null);
  protected readonly subtitle = computed(() => {
    const s = this.screening();
    return s ? `Show Date: ${showDate(s.date, s.time)}` : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selectedIds = computed(() => new Set(this.booking.booking()?.seats ?? []));

  protected readonly count = computed(() => this.booking.booking()?.seats.length ?? 0);
  protected readonly rowLines = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of buildItems(this.booking.booking()?.seats ?? [])) {
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), describeItem(item)]);
    }
    return [...byRow].map(([row, seats]) => ({ row, text: `Row ${row}: ${seats.join(', ')}` }));
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.screeningWithMovie(id ?? '').subscribe({
      next: ({ screening }) => {
        if (!this.booking.isInProgressFor(screening.id)) this.booking.startNew(screening.id);
        this.screening.set(screening);
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  private ids(row: number, col: number, colEnd: number): string[] {
    return col === colEnd ? [seatId(row, col)] : [seatId(row, col), seatId(row, colEnd)];
  }

  protected state(row: number, cell: Cell): SeatState {
    const ids = this.ids(row, cell.col, cell.colEnd);
    const occupied = this.occupied();
    const selected = this.selectedIds();
    if (ids.some((i) => occupied.has(i))) return 'unavailable';
    if (ids.every((i) => selected.has(i))) return 'selected';
    if (row === 1 && cell.kind === 'seat' && cell.col >= 10 && cell.col <= 15) return 'accessible';
    return 'available';
  }

  protected toggle(row: number, cell: Cell) {
    const state = this.state(row, cell);
    if (state === 'unavailable') return;
    const ids = this.ids(row, cell.col, cell.colEnd);
    const current = this.booking.booking()?.seats ?? [];
    if (state === 'selected') {
      this.booking.setSeats(current.filter((i) => !ids.includes(i)));
    } else if (current.length + ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.booking.setSeats([...current, ...ids]);
    }
  }

  protected cancel() {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next() {
    if (this.count() === 0) return;
    this.router.navigate(['/screenings', this.route.snapshot.paramMap.get('id'), 'summary']);
  }

}
