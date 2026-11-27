import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Api } from '../api.service';
import { BookingService } from '../booking.service';
import { Movie, Screening } from '../models';
import { COUCH_ROW, MAX_SEATS, ROW_COUNT, itemsFromSeats, seatId, showDate } from '../seat-utils';
import { ToastService } from '../toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface Cell {
  row: number;
  start: number;
  end: number;
  couch: boolean;
  ids: string[];
}

interface Block {
  entrance: boolean;
  cells: Cell[];
}

interface RowModel {
  row: number;
  blocks: Block[];
}

const BLOCKS: [number, number][] = [
  [1, 4],
  [5, 20],
  [21, 24],
];

function buildRows(): RowModel[] {
  return Array.from({ length: ROW_COUNT }, (_, i) => {
    const row = i + 1;
    const blocks = BLOCKS.map(([from, to], blockIndex): Block => {
      if (blockIndex === 0 && row <= 10) return { entrance: true, cells: [] };
      const cells: Cell[] = [];
      if (row === COUCH_ROW) {
        for (let c = from; c < to; c += 2) {
          cells.push({
            row,
            start: c,
            end: c + 1,
            couch: true,
            ids: [seatId(row, c), seatId(row, c + 1)],
          });
        }
      } else {
        for (let c = from; c <= to; c++) {
          cells.push({ row, start: c, end: c, couch: false, ids: [seatId(row, c)] });
        }
      }
      return { entrance: false, cells };
    });
    return { row, blocks };
  });
}

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  template: `
    @if (screening(); as s) {
      <div class="page">
        <h1 data-testid="seat-map-title">Choose your seats</h1>
        <h2 data-testid="seat-map-subtitle">Show Date: {{ showDateText() }}</h2>

        <div class="auditorium">
          <p class="limit" data-testid="seat-limit-info">
            You can reserve up to 10 seats per reservation
          </p>
          <div class="screen" data-testid="screen-indicator">SCREEN</div>
          <div class="seat-map" data-testid="seat-map">
            @for (r of rows; track r.row) {
              <div class="seat-row" data-testid="seat-row" [attr.data-row]="r.row">
                <span class="row-label" data-testid="row-label-left" [attr.data-row]="r.row">{{
                  r.row
                }}</span>
                @for (block of r.blocks; track $index) {
                  @if ($index > 0) {
                    <div class="aisle" data-testid="aisle" [attr.data-row]="r.row"></div>
                  }
                  @if (block.entrance) {
                    <div class="entrance"></div>
                  }
                  @for (cell of block.cells; track cell.start) {
                    @if (cell.couch) {
                      <button
                        type="button"
                        class="cell couch"
                        data-testid="couch"
                        [attr.data-row]="cell.row"
                        [attr.data-column-start]="cell.start"
                        [attr.data-column-end]="cell.end"
                        [attr.data-state]="stateOf(cell)"
                        (click)="toggle(cell)"
                      >{{ cell.start }}-{{ cell.end }}</button>
                    } @else {
                      <button
                        type="button"
                        class="cell seat"
                        data-testid="seat"
                        [attr.data-row]="cell.row"
                        [attr.data-column]="cell.start"
                        [attr.data-state]="stateOf(cell)"
                        (click)="toggle(cell)"
                      >{{ cell.start }}</button>
                    }
                  }
                }
                <span class="row-label" data-testid="row-label-right" [attr.data-row]="r.row">{{
                  r.row
                }}</span>
              </div>
            }
          </div>

          <div class="legend" data-testid="legend">
            @for (item of legend; track item.state) {
              <div class="legend-item" data-testid="legend-item" [attr.data-state]="item.state">
                <span class="swatch" [class]="'swatch ' + item.state"></span>
                <span>{{ item.label }}</span>
              </div>
            }
          </div>
        </div>

        <div class="selected-panel" data-testid="selected-seats">
          <div data-testid="selected-seats-count">Selected seats: {{ count() }}</div>
          @for (line of lines(); track line.row) {
            <div data-testid="selected-seats-row" [attr.data-row]="line.row">Row {{ line.row }}: {{ line.text }}</div>
          }
        </div>

        <div class="button-row">
          <button mat-stroked-button type="button" data-testid="cancel-button" (click)="cancel()">Cancel</button>
          <button mat-flat-button type="button" data-testid="continue-button" (click)="next(s.id)">Continue</button>
        </div>
      </div>
    }
  `,
  styles: `
    $cell: 36px;
    .auditorium {
      width: $cell * 30;
      margin: 0 auto;
    }
    .limit {
      text-align: center;
    }
    .screen {
      background: #9e9e9e;
      color: #fff;
      text-align: center;
      padding: 8px;
      margin: 0 $cell * 2 16px;
      border-radius: 4px 4px 50% 50% / 4px 4px 12px 12px;
      letter-spacing: 4px;
    }
    .seat-row {
      display: flex;
      align-items: center;
    }
    .row-label {
      width: $cell;
      text-align: center;
      font-size: 14px;
    }
    .aisle {
      width: $cell * 2;
      height: $cell;
    }
    .entrance {
      width: $cell * 4;
      height: $cell;
    }
    .cell {
      box-sizing: border-box;
      width: $cell - 4px;
      height: $cell - 4px;
      margin: 2px;
      padding: 0;
      border: 0;
      border-radius: 6px;
      font: inherit;
      font-size: 12px;
      color: #fff;
      cursor: pointer;
    }
    .couch {
      width: $cell * 2 - 4px;
      border-radius: 10px;
      border-bottom: 4px solid rgba(0, 0, 0, 0.35);
    }
    .cell[data-state='unavailable'] {
      cursor: not-allowed;
    }
    .cell[data-state='selected'],
    .swatch.selected {
      color: #000;
    }
    .cell[data-state='available'],
    .swatch.available {
      background-color: #2e7d32;
    }
    .cell[data-state='selected'],
    .swatch.selected {
      background-color: #f9a825;
    }
    .cell[data-state='unavailable'],
    .swatch.unavailable {
      background-color: #c62828;
    }
    .cell[data-state='accessible'],
    .swatch.accessible {
      background-color: #1565c0;
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin: 16px 0;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .swatch {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }
    .selected-panel {
      margin-top: 16px;
    }
  `,
})
export class SeatMap {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly rows = buildRows();
  protected readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selectedIds = computed(
    () => new Set(this.bookingService.booking()?.seats ?? []),
  );
  protected readonly count = computed(() => this.selectedIds().size);
  protected readonly showDateText = computed(() => {
    const s = this.screening();
    return s ? showDate(s.date, s.time) : '';
  });
  protected readonly lines = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of itemsFromSeats(this.bookingService.booking()?.seats ?? [])) {
      const text = item.couch ? `${item.colStart}-${item.colEnd}` : String(item.colStart);
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), text]);
    }
    return [...byRow.entries()].map(([row, parts]) => ({ row, text: parts.join(', ') }));
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.api
      .screening(id)
      .pipe(
        switchMap((screening) => {
          this.bookingService.startFor(screening.id);
          this.screening.set(screening);
          return this.api.movie(screening.movieId).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (movie) => this.movie.set(movie),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected stateOf(cell: Cell): SeatState {
    const occupied = this.occupied();
    if (cell.ids.some((id) => occupied.has(id))) return 'unavailable';
    if (cell.ids.every((id) => this.selectedIds().has(id))) return 'selected';
    if (cell.row === 1 && cell.start >= 10 && cell.start <= 15) return 'accessible';
    return 'available';
  }

  protected toggle(cell: Cell): void {
    const state = this.stateOf(cell);
    if (state === 'unavailable') return;
    const current = this.bookingService.booking()?.seats ?? [];
    if (state === 'selected') {
      this.bookingService.setSeats(current.filter((id) => !cell.ids.includes(id)));
    } else if (current.length + cell.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.bookingService.setSeats([...current, ...cell.ids]);
    }
  }

  protected cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  protected next(screeningId: number): void {
    if (this.count() === 0) return;
    this.router.navigate(['/screenings', screeningId, 'summary']);
  }
}
