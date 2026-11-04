import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../core/booking.service';
import { ApiService } from '../core/api.service';
import { formatShowDate } from '../core/dates';
import { Screening } from '../core/models';
import {
  MAX_SEATS,
  SeatState,
  buildRows,
  gridTrack,
  isAccessibleSeat,
  seatId,
} from '../core/seats';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  template: `
    @if (screening(); as s) {
      <div class="page">
        <h1 data-testid="seat-map-title">Choose your seats</h1>
        <h2 data-testid="seat-map-subtitle">Show Date: {{ showDate() }}</h2>

        <div class="auditorium">
          <p class="limit" data-testid="seat-limit-info">You can reserve up to 10 seats per reservation</p>
          <div class="screen" data-testid="screen-indicator">SCREEN</div>
          <div class="seat-map" data-testid="seat-map">
            @for (row of rows; track row.row) {
              <div class="row" data-testid="seat-row" [attr.data-row]="row.row">
                <span class="label" data-testid="row-label-left" [attr.data-row]="row.row" style="grid-column: 1">{{ row.row }}</span>
                <div class="aisle" data-testid="aisle" [attr.data-row]="row.row" style="grid-column: 6"></div>
                <div class="aisle" data-testid="aisle" [attr.data-row]="row.row" style="grid-column: 23"></div>
                @for (cell of row.cells; track cell.col) {
                  @if (cell.couch) {
                    <button
                      type="button"
                      class="couch"
                      data-testid="couch"
                      [attr.data-row]="row.row"
                      [attr.data-column-start]="cell.col"
                      [attr.data-column-end]="cell.col + 1"
                      [attr.data-state]="couchState(row.row, cell.col)"
                      [attr.aria-disabled]="couchState(row.row, cell.col) === 'unavailable'"
                      [style.grid-column]="track(cell.col) + ' / span 2'"
                      (click)="toggleCouch(row.row, cell.col)"
                    >{{ cell.col }}-{{ cell.col + 1 }}</button>
                  } @else {
                    <button
                      type="button"
                      class="seat"
                      data-testid="seat"
                      [attr.data-row]="row.row"
                      [attr.data-column]="cell.col"
                      [attr.data-state]="seatState(row.row, cell.col)"
                      [attr.aria-disabled]="seatState(row.row, cell.col) === 'unavailable'"
                      [style.grid-column]="track(cell.col)"
                      (click)="toggleSeat(row.row, cell.col)"
                    >{{ cell.col }}</button>
                  }
                }
                <span class="label" data-testid="row-label-right" [attr.data-row]="row.row" style="grid-column: 28">{{ row.row }}</span>
              </div>
            }
          </div>

          <div class="legend" data-testid="legend">
            @for (item of legend; track item.state) {
              <div class="legend-item" data-testid="legend-item" [attr.data-state]="item.state">
                <span class="swatch"></span>
                <span>{{ item.label }}</span>
              </div>
            }
          </div>
        </div>

        <div class="selected-seats" data-testid="selected-seats">
          <div data-testid="selected-seats-count">Selected seats: {{ seatCount() }}</div>
          @for (line of selectionLines(); track line.row) {
            <div data-testid="selected-seats-row" [attr.data-row]="line.row">Row {{ line.row }}: {{ line.seats }}</div>
          }
        </div>

        <div class="actions">
          <button matButton="outlined" data-testid="cancel-button" (click)="cancel()">Cancel</button>
          <button matButton="filled" data-testid="continue-button" (click)="next()">Continue</button>
        </div>
      </div>
    }
  `,
  styles: `
    h1 {
      margin: 0 0 4px;
    }
    h2 {
      margin: 0 0 16px;
      font-weight: 400;
    }
    .auditorium {
      width: fit-content;
      max-width: 100%;
      overflow-x: auto;
      margin: 0 auto;
    }
    .limit {
      text-align: center;
      margin: 0 0 16px;
    }
    .screen {
      text-align: center;
      background: #424242;
      color: #fff;
      letter-spacing: 0.5em;
      padding: 8px;
      border-radius: 4px 4px 40px 40px;
      margin: 0 0 20px;
    }
    .seat-map {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .row {
      display: grid;
      grid-template-columns: 30px repeat(4, 34px) 72px repeat(16, 34px) 72px repeat(4, 34px) 30px;
      column-gap: 4px;
      align-items: center;
    }
    .label {
      text-align: center;
      font-size: 0.85rem;
      color: #555;
    }
    .aisle {
      height: 1px;
    }
    .seat,
    .couch {
      box-sizing: border-box;
      height: 30px;
      padding: 0;
      border: none;
      border-radius: 6px;
      color: #fff;
      font: inherit;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .couch {
      border-radius: 10px;
      border: 2px solid rgba(0, 0, 0, 0.35);
    }
    .seat[data-state='available'],
    .couch[data-state='available'] {
      background-color: #2e7d32;
    }
    .seat[data-state='selected'],
    .couch[data-state='selected'] {
      background-color: #f9a825;
      color: #212121;
    }
    .seat[data-state='unavailable'],
    .couch[data-state='unavailable'] {
      background-color: #c62828;
      cursor: not-allowed;
    }
    .seat[data-state='accessible'],
    .couch[data-state='accessible'] {
      background-color: #1565c0;
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 20px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .swatch {
      width: 18px;
      height: 18px;
      border-radius: 4px;
    }
    .legend-item[data-state='available'] .swatch {
      background-color: #2e7d32;
    }
    .legend-item[data-state='selected'] .swatch {
      background-color: #f9a825;
    }
    .legend-item[data-state='unavailable'] .swatch {
      background-color: #c62828;
    }
    .legend-item[data-state='accessible'] .swatch {
      background-color: #1565c0;
    }
    .selected-seats {
      margin-top: 24px;
      text-align: center;
    }
  `,
})
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly rows = buildRows();
  readonly track = gridTrack;
  readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  readonly screening = signal<Screening | null>(null);
  private readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  readonly showDate = computed(() => {
    const s = this.screening();
    return s ? formatShowDate(s.date, s.time) : '';
  });
  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => new Set(this.bookingService.seats()));
  readonly seatCount = computed(() => this.bookingService.seats().length);

  readonly selectionLines = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const t of this.bookingService.tickets()) {
      const text = t.couch ? `${t.colStart}-${t.colEnd}` : `${t.colStart}`;
      byRow.set(t.row, [...(byRow.get(t.row) ?? []), text]);
    }
    return [...byRow.entries()].map(([row, seats]) => ({ row, seats: seats.join(', ') }));
  });

  constructor() {
    this.api
      .screening(this.screeningId)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: (screening) => {
          if (!this.bookingService.isInProgressFor(screening.id)) {
            this.bookingService.start(screening.id);
          }
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  seatState(row: number, col: number): SeatState {
    const id = seatId(row, col);
    if (this.occupied().has(id)) return 'unavailable';
    if (this.selected().has(id)) return 'selected';
    return isAccessibleSeat(row, col) ? 'accessible' : 'available';
  }

  couchState(row: number, col: number): SeatState {
    const ids = [seatId(row, col), seatId(row, col + 1)];
    if (ids.some((id) => this.occupied().has(id))) return 'unavailable';
    return ids.every((id) => this.selected().has(id)) ? 'selected' : 'available';
  }

  toggleSeat(row: number, col: number): void {
    this.toggle(this.seatState(row, col), [seatId(row, col)]);
  }

  toggleCouch(row: number, col: number): void {
    this.toggle(this.couchState(row, col), [seatId(row, col), seatId(row, col + 1)]);
  }

  private toggle(state: SeatState, ids: string[]): void {
    if (state === 'unavailable') return;
    const current = this.bookingService.seats();
    if (state === 'selected') {
      this.bookingService.setSeats(current.filter((id) => !ids.includes(id)));
    } else if (current.length + ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.bookingService.setSeats([...current, ...ids]);
    }
  }

  cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  next(): void {
    if (this.seatCount() === 0) return;
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
