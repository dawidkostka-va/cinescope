import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { COUCH_ROW, MAX_SEATS, BookingService, seatId } from '../booking.service';
import { formatShowDate } from '../dates';
import { Movie, Screening } from '../models';
import { ToastService } from '../toast';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

interface Cell {
  couch: boolean;
  row: number;
  col: number;
  colEnd: number;
  ids: string[];
  state: SeatState;
}

interface RowView {
  row: number;
  left: Cell[] | null;
  mid: Cell[];
  right: Cell[];
}

const ROWS = Array.from({ length: 15 }, (_, i) => i + 1);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const isAccessible = (row: number, col: number) => row === 1 && col >= 10 && col <= 15;

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule, NgTemplateOutlet],
  template: `
    @if (screening(); as s) {
      <div class="page">
        <h1 data-testid="seat-map-title">Choose your seats</h1>
        <p class="subtitle" data-testid="seat-map-subtitle">Show Date: {{ showDate() }}</p>

        <div class="auditorium">
          <p class="limit" data-testid="seat-limit-info">You can reserve up to 10 seats per reservation</p>
          <div class="screen" data-testid="screen-indicator">SCREEN</div>
          <div class="map" data-testid="seat-map">
            @for (r of rows(); track r.row) {
              <div class="row" data-testid="seat-row" [attr.data-row]="r.row">
                <span class="label" data-testid="row-label-left" [attr.data-row]="r.row">{{ r.row }}</span>
                @if (r.left; as left) {
                  <div class="block block-left">
                    @for (c of left; track c.col) {
                      <ng-container *ngTemplateOutlet="cell; context: { $implicit: c }" />
                    }
                  </div>
                } @else {
                  <div class="block block-left entrance"></div>
                }
                <div class="aisle" data-testid="aisle" [attr.data-row]="r.row"></div>
                <div class="block block-mid">
                  @for (c of r.mid; track c.col) {
                    <ng-container *ngTemplateOutlet="cell; context: { $implicit: c }" />
                  }
                </div>
                <div class="aisle" data-testid="aisle" [attr.data-row]="r.row"></div>
                <div class="block block-right">
                  @for (c of r.right; track c.col) {
                    <ng-container *ngTemplateOutlet="cell; context: { $implicit: c }" />
                  }
                </div>
                <span class="label" data-testid="row-label-right" [attr.data-row]="r.row">{{ r.row }}</span>
              </div>
            }
          </div>

          <div class="legend" data-testid="legend">
            @for (item of legend; track item.state) {
              <span class="legend-item" data-testid="legend-item" [attr.data-state]="item.state">
                <span class="swatch" [attr.data-swatch]="item.state"></span>{{ item.label }}
              </span>
            }
          </div>
        </div>

        <div class="panel" data-testid="selected-seats">
          <div data-testid="selected-seats-count">Selected seats: {{ booking.seatCount() }}</div>
          @for (line of selectionLines(); track line.row) {
            <div data-testid="selected-seats-row" [attr.data-row]="line.row">Row {{ line.row }}: {{ line.text }}</div>
          }
        </div>

        <div class="actions">
          <button mat-stroked-button data-testid="cancel-button" (click)="cancel()">Cancel</button>
          <button
            mat-flat-button
            data-testid="continue-button"
            [disabled]="booking.seatCount() === 0"
            (click)="next()"
          >
            Continue
          </button>
        </div>
      </div>
    }

    <ng-template #cell let-c>
      @if (c.couch) {
        <div
          class="couch"
          data-testid="couch"
          [attr.data-row]="c.row"
          [attr.data-column-start]="c.col"
          [attr.data-column-end]="c.colEnd"
          [attr.data-state]="c.state"
          role="button"
          tabindex="0"
          (click)="toggle(c)"
          (keydown.enter)="toggle(c)"
        >
          {{ c.col }}-{{ c.colEnd }}
        </div>
      } @else {
        <div
          class="seat"
          data-testid="seat"
          [attr.data-row]="c.row"
          [attr.data-column]="c.col"
          [attr.data-state]="c.state"
          role="button"
          tabindex="0"
          (click)="toggle(c)"
          (keydown.enter)="toggle(c)"
        >
          {{ c.col }}
        </div>
      }
    </ng-template>
  `,
  styles: `
    h1 {
      text-align: center;
      margin: 0 0 4px;
    }
    .subtitle {
      text-align: center;
      margin: 0 0 24px;
      color: #555;
    }
    .auditorium {
      width: fit-content;
      margin: 0 auto;
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
      margin: 0 48px 20px;
      border-radius: 4px 4px 40px 40px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }
    .label {
      width: 40px;
      text-align: center;
      font-size: 13px;
      color: #555;
    }
    .block {
      display: flex;
      gap: 4px;
    }
    .block-left,
    .block-right {
      width: 140px;
    }
    .block-mid {
      width: 572px;
    }
    .aisle {
      width: 68px;
      flex: none;
    }
    .seat,
    .couch {
      box-sizing: border-box;
      height: 32px;
      line-height: 32px;
      text-align: center;
      font-size: 12px;
      color: #fff;
      border-radius: 6px;
      user-select: none;
      flex: none;
    }
    .seat {
      width: 32px;
      border-radius: 6px 6px 3px 3px;
    }
    .couch {
      width: 68px;
      border: 2px solid rgba(0, 0, 0, 0.35);
    }
    [data-state='unavailable'] {
      cursor: not-allowed;
    }
    [data-state='available'],
    [data-state='selected'],
    [data-state='accessible'] {
      cursor: pointer;
    }
    [data-state='available'],
    [data-swatch='available'] {
      background-color: #2e7d32;
    }
    [data-state='selected'],
    [data-swatch='selected'] {
      background-color: #f9a825;
    }
    .seat[data-state='selected'],
    .couch[data-state='selected'] {
      color: #212121;
    }
    [data-state='unavailable'],
    [data-swatch='unavailable'] {
      background-color: #c62828;
    }
    [data-state='accessible'],
    [data-swatch='accessible'] {
      background-color: #1565c0;
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 20px;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .swatch {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      display: inline-block;
    }
    .panel {
      margin: 24px auto 0;
      width: fit-content;
      min-width: 240px;
      line-height: 1.6;
    }
  `,
})
export class SeatMapPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  protected readonly booking = inject(BookingService);

  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);
  private readonly movie = signal<Movie | null>(null);

  protected readonly showDate = computed(() => {
    const s = this.screening();
    return s ? formatShowDate(s.date, s.time) : '';
  });

  private readonly selected = computed(() => new Set(this.booking.booking()?.seats ?? []));
  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));

  protected readonly rows = computed<RowView[]>(() => {
    const occupied = this.occupied();
    const selected = this.selected();
    const seat = (row: number, col: number): Cell => {
      const id = seatId(row, col);
      const state: SeatState = occupied.has(id)
        ? 'unavailable'
        : selected.has(id)
          ? 'selected'
          : isAccessible(row, col)
            ? 'accessible'
            : 'available';
      return { couch: false, row, col, colEnd: col, ids: [id], state };
    };
    const couch = (row: number, col: number): Cell => {
      const ids = [seatId(row, col), seatId(row, col + 1)];
      const state: SeatState = ids.some((i) => occupied.has(i))
        ? 'unavailable'
        : ids.every((i) => selected.has(i))
          ? 'selected'
          : 'available';
      return { couch: true, row, col, colEnd: col + 1, ids, state };
    };
    const block = (row: number, from: number, to: number): Cell[] => {
      if (row === COUCH_ROW) return range(from, to).filter((c) => c % 2 === 1).map((c) => couch(row, c));
      return range(from, to).map((c) => seat(row, c));
    };
    return ROWS.map((row) => ({
      row,
      left: row >= 11 ? block(row, 1, 4) : null,
      mid: block(row, 5, 20),
      right: block(row, 21, 24),
    }));
  });

  protected readonly selectionLines = computed(() => {
    const lines: { row: number; text: string }[] = [];
    for (const t of this.booking.tickets()) {
      const part = t.couch ? `${t.colStart}-${t.colEnd}` : String(t.colStart);
      const last = lines[lines.length - 1];
      if (last && last.row === t.row) last.text += `, ${part}`;
      else lines.push({ row: t.row, text: part });
    }
    return lines;
  });

  constructor() {
    this.api.getScreening(this.id).subscribe({
      next: (screening) => {
        this.api.getMovie(screening.movieId).subscribe({
          next: (movie) => {
            this.movie.set(movie);
            this.booking.openFor(screening.id);
            this.screening.set(screening);
          },
          error: () => this.router.navigateByUrl('/'),
        });
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  protected toggle(cell: Cell): void {
    if (cell.state === 'unavailable') return;
    const seats = this.booking.booking()?.seats ?? [];
    if (cell.state === 'selected') {
      this.booking.setSeats(seats.filter((s) => !cell.ids.includes(s)));
      return;
    }
    if (this.booking.seatCount() + cell.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.booking.setSeats([...seats, ...cell.ids]);
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    if (this.booking.seatCount() === 0) return;
    this.router.navigate(['/screenings', this.id, 'summary']);
  }
}
