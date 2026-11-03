import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../booking.service';
import { ApiService } from '../api.service';
import { showDate } from '../dates';
import { Screening } from '../models';
import {
  COUCH_ROW,
  MAX_SEATS,
  ROWS,
  SeatState,
  firstColumn,
  isAccessible,
  itemFor,
  itemLabel,
  seatId,
} from '../seats';
import { ToastService } from '../toast.service';

interface Cell {
  couch: boolean;
  row: number;
  colStart: number;
  colEnd: number;
  ids: string[];
  state: SeatState;
  gridColumn: number;
  label: string;
}

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

const gridColumn = (column: number) => (column <= 4 ? column + 1 : column <= 20 ? column + 2 : column + 3);

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  template: `
    @if (screening(); as s) {
      <div class="page">
        <h1 data-testid="seat-map-title">Choose your seats</h1>
        <p class="subtitle" data-testid="seat-map-subtitle">Show Date: {{ showDateText() }}</p>
        <div class="stage">
          <p class="limit" data-testid="seat-limit-info">You can reserve up to 10 seats per reservation</p>
          <div class="screen" data-testid="screen-indicator">SCREEN</div>
          <div class="seat-map" data-testid="seat-map">
            @for (row of rows(); track row.row) {
              <div class="seat-row" data-testid="seat-row" [attr.data-row]="row.row">
                <span class="row-label left" data-testid="row-label-left" [attr.data-row]="row.row">{{ row.row }}</span>
                @for (cell of row.cells; track cell.ids[0]) {
                  @if (cell.couch) {
                    <button
                      type="button"
                      class="seat couch"
                      data-testid="couch"
                      [attr.data-row]="cell.row"
                      [attr.data-column-start]="cell.colStart"
                      [attr.data-column-end]="cell.colEnd"
                      [attr.data-state]="cell.state"
                      [style.grid-column]="cell.gridColumn + ' / span 2'"
                      (click)="toggle(cell)"
                    >
                      {{ cell.label }}
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="seat"
                      data-testid="seat"
                      [attr.data-row]="cell.row"
                      [attr.data-column]="cell.colStart"
                      [attr.data-state]="cell.state"
                      [style.grid-column]="cell.gridColumn"
                      (click)="toggle(cell)"
                    >
                      {{ cell.label }}
                    </button>
                  }
                }
                <span class="aisle" data-testid="aisle" [attr.data-row]="row.row" style="grid-column: 6"></span>
                <span class="aisle" data-testid="aisle" [attr.data-row]="row.row" style="grid-column: 23"></span>
                <span class="row-label right" data-testid="row-label-right" [attr.data-row]="row.row">{{ row.row }}</span>
              </div>
            }
          </div>
          <div class="legend" data-testid="legend">
            @for (entry of legend; track entry.state) {
              <span class="legend-item" data-testid="legend-item" [attr.data-state]="entry.state">
                <span class="swatch" [attr.data-state]="entry.state"></span>{{ entry.label }}
              </span>
            }
          </div>
        </div>
        <div class="panel" data-testid="selected-seats">
          <div data-testid="selected-seats-count">Selected seats: {{ count() }}</div>
          @for (line of lines(); track line.row) {
            <div data-testid="selected-seats-row" [attr.data-row]="line.row">Row {{ line.row }}: {{ line.text }}</div>
          }
        </div>
        <div class="actions">
          <button mat-stroked-button type="button" data-testid="cancel-button" (click)="cancel()">Cancel</button>
          <button
            mat-flat-button
            type="button"
            data-testid="continue-button"
            [disabled]="count() === 0"
            (click)="next(s.id)"
          >
            Continue
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      --available: #2e7d32;
      --selected: #f9a825;
      --unavailable: #c62828;
      --accessible: #1565c0;
    }
    .page {
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h1 {
      margin: 0 0 4px;
    }
    .subtitle {
      margin: 0 0 16px;
      color: #555;
    }
    .stage {
      width: fit-content;
    }
    .limit {
      text-align: center;
      margin: 0 0 12px;
    }
    .screen {
      background: #424242;
      color: #fff;
      text-align: center;
      letter-spacing: 6px;
      padding: 8px;
      margin-bottom: 20px;
      border-radius: 0 0 40px 40px;
    }
    .seat-row {
      display: grid;
      grid-template-columns: 28px repeat(4, 32px) 72px repeat(16, 32px) 72px repeat(4, 32px) 28px;
      column-gap: 4px;
      margin-bottom: 4px;
    }
    .seat-row > * {
      grid-row: 1;
    }
    .row-label {
      align-self: center;
      font-size: 12px;
      color: #555;
    }
    .row-label.left {
      grid-column: 1;
      text-align: left;
    }
    .row-label.right {
      grid-column: 28;
      text-align: right;
    }
    .seat {
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 6px;
      color: #fff;
      font: 500 12px Roboto, sans-serif;
      cursor: pointer;
    }
    .seat.couch {
      border-radius: 12px;
      box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.25);
    }
    .seat[data-state='available'] {
      background-color: var(--available);
    }
    .seat[data-state='selected'] {
      background-color: var(--selected);
      color: #000;
    }
    .seat[data-state='unavailable'] {
      background-color: var(--unavailable);
      cursor: not-allowed;
    }
    .seat[data-state='accessible'] {
      background-color: var(--accessible);
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 16px;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .swatch {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }
    .swatch[data-state='available'] {
      background-color: var(--available);
    }
    .swatch[data-state='selected'] {
      background-color: var(--selected);
    }
    .swatch[data-state='unavailable'] {
      background-color: var(--unavailable);
    }
    .swatch[data-state='accessible'] {
      background-color: var(--accessible);
    }
    .panel {
      margin: 24px 0 16px;
      min-width: 240px;
    }
    .actions {
      display: flex;
      gap: 12px;
    }
  `,
})
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);

  protected readonly showDateText = computed(() => {
    const s = this.screening();
    return s ? showDate(s.date, s.time) : '';
  });

  private readonly selected = computed(() => new Set(this.booking.state()?.seats ?? []));
  protected readonly count = computed(() => this.selected().size);

  protected readonly rows = computed(() => {
    const screening = this.screening();
    const occupied = new Set(screening?.occupiedSeats ?? []);
    const selected = this.selected();
    return Array.from({ length: ROWS }, (_, i) => {
      const row = i + 1;
      const cells: Cell[] = [];
      if (row === COUCH_ROW) {
        for (let start = 1; start <= 23; start += 2) {
          const item = itemFor(row, start);
          const state: SeatState = item.ids.some((id) => occupied.has(id))
            ? 'unavailable'
            : item.ids.every((id) => selected.has(id))
              ? 'selected'
              : 'available';
          cells.push({ ...item, state, gridColumn: gridColumn(start), label: itemLabel(item) });
        }
      } else {
        for (let column = firstColumn(row); column <= 24; column++) {
          const id = seatId(row, column);
          const state: SeatState = occupied.has(id)
            ? 'unavailable'
            : selected.has(id)
              ? 'selected'
              : isAccessible(row, column)
                ? 'accessible'
                : 'available';
          const item = itemFor(row, column);
          cells.push({ ...item, state, gridColumn: gridColumn(column), label: String(column) });
        }
      }
      return { row, cells };
    });
  });

  protected readonly lines = computed(() =>
    this.booking
      .items()
      .reduce<{ row: number; parts: string[] }[]>((acc, item) => {
        const last = acc[acc.length - 1];
        if (last && last.row === item.row) last.parts.push(itemLabel(item));
        else acc.push({ row: item.row, parts: [itemLabel(item)] });
        return acc;
      }, [])
      .map((line) => ({ row: line.row, text: line.parts.join(', ') })),
  );

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    this.api
      .screening(id)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: (screening) => {
          if (!this.booking.isInProgressFor(screening.id)) this.booking.start(screening.id);
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected toggle(cell: Cell): void {
    if (cell.state === 'unavailable') return;
    const seats = this.booking.state()?.seats ?? [];
    if (cell.state === 'selected') {
      this.booking.setSeats(seats.filter((id) => !cell.ids.includes(id)));
    } else if (seats.length + cell.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.booking.setSeats([...seats, ...cell.ids]);
    }
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(id: number): void {
    if (this.count() > 0) this.router.navigate(['/screenings', id, 'summary']);
  }
}
