import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService } from '../booking.service';
import { Movie, Screening } from '../models';
import { COLUMNS, COUCH_ROW, MAX_SEATS, ROWS, Ticket, makeTicket, showDate, ticketsFromSeats } from '../seating';
import { ToastService } from '../toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

type Cell =
  | { type: 'spacer' }
  | { type: 'aisle' }
  | { type: 'seat'; ticket: Ticket; accessible: boolean }
  | { type: 'couch'; ticket: Ticket };

interface RowModel {
  row: number;
  cells: Cell[];
}

function buildRows(): RowModel[] {
  const rows: RowModel[] = [];
  for (let row = 1; row <= ROWS; row++) {
    const cells: Cell[] = [];
    const addRange = (from: number, to: number) => {
      if (row === COUCH_ROW) {
        for (let c = from; c < to; c += 2) cells.push({ type: 'couch', ticket: makeTicket(row, c) });
      } else {
        for (let c = from; c <= to; c++) {
          cells.push({ type: 'seat', ticket: makeTicket(row, c), accessible: row === 1 && c >= 10 && c <= 15 });
        }
      }
    };
    if (row > 10) addRange(1, 4);
    else cells.push({ type: 'spacer' });
    cells.push({ type: 'aisle' });
    addRange(5, 20);
    cells.push({ type: 'aisle' });
    addRange(21, COLUMNS);
    rows.push({ row, cells });
  }
  return rows;
}

@Component({
  selector: 'app-seat-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    @if (screening(); as s) {
      <div class="page">
        <h1 data-testid="seat-map-title">Choose your seats</h1>
        <h3 data-testid="seat-map-subtitle">Show Date: {{ showDateText() }}</h3>

        <div class="auditorium">
          <p class="limit" data-testid="seat-limit-info">You can reserve up to 10 seats per reservation</p>
          <div class="screen" data-testid="screen-indicator">SCREEN</div>
          <div class="seat-map" data-testid="seat-map">
            @for (r of rows; track r.row) {
              <div class="seat-row" data-testid="seat-row" [attr.data-row]="r.row">
                <span class="row-label" data-testid="row-label-left" [attr.data-row]="r.row">{{ r.row }}</span>
                @for (cell of r.cells; track $index) {
                  @switch (cell.type) {
                    @case ('spacer') {
                      <div class="entrance"></div>
                    }
                    @case ('aisle') {
                      <div class="aisle" data-testid="aisle" [attr.data-row]="r.row"></div>
                    }
                    @case ('seat') {
                      <button
                        type="button"
                        class="seat"
                        data-testid="seat"
                        [attr.data-row]="cell.ticket.row"
                        [attr.data-column]="cell.ticket.columnStart"
                        [attr.data-state]="stateOf(cell)"
                        (click)="toggle(cell.ticket)"
                      >{{ cell.ticket.columnStart }}</button>
                    }
                    @case ('couch') {
                      <button
                        type="button"
                        class="couch"
                        data-testid="couch"
                        [attr.data-row]="cell.ticket.row"
                        [attr.data-column-start]="cell.ticket.columnStart"
                        [attr.data-column-end]="cell.ticket.columnEnd"
                        [attr.data-state]="stateOf(cell)"
                        (click)="toggle(cell.ticket)"
                      >{{ cell.ticket.columnStart }}-{{ cell.ticket.columnEnd }}</button>
                    }
                  }
                }
                <span class="row-label" data-testid="row-label-right" [attr.data-row]="r.row">{{ r.row }}</span>
              </div>
            }
          </div>
        </div>

        <div class="legend" data-testid="legend">
          @for (item of legend; track item.state) {
            <span class="legend-item" data-testid="legend-item" [attr.data-state]="item.state">
              <span class="swatch" [attr.data-state]="item.state"></span>{{ item.label }}
            </span>
          }
        </div>

        <div class="selected-seats" data-testid="selected-seats">
          <div data-testid="selected-seats-count">Selected seats: {{ seatCount() }}</div>
          @for (line of selectionLines(); track line.row) {
            <div data-testid="selected-seats-row" [attr.data-row]="line.row">Row {{ line.row }}: {{ line.text }}</div>
          }
        </div>

        <div class="actions">
          <button mat-stroked-button type="button" data-testid="cancel-button" (click)="cancel()">Cancel</button>
          <button
            mat-flat-button
            type="button"
            data-testid="continue-button"
            [disabled]="seatCount() === 0"
            (click)="next()"
          >
            Continue
          </button>
        </div>
      </div>
    } @else {
      <p class="loading">Loading…</p>
    }
  `,
  styles: `
    :host {
      --seat: 30px;
      --gap: 4px;
    }
    .page {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 24px 32px;
    }
    h1 {
      margin: 8px 0 0;
    }
    h3 {
      margin: 4px 0 16px;
      font-weight: 400;
    }
    .loading {
      padding: 24px;
    }
    .auditorium {
      width: fit-content;
    }
    .limit {
      text-align: center;
      margin: 0 0 12px;
    }
    .screen {
      text-align: center;
      background: #cfd8dc;
      color: #263238;
      letter-spacing: 6px;
      font-weight: 500;
      padding: 6px 0;
      border-radius: 4px 4px 24px 24px;
      margin-bottom: 16px;
    }
    .seat-map {
      display: flex;
      flex-direction: column;
      gap: var(--gap);
    }
    .seat-row {
      display: flex;
      align-items: center;
      gap: var(--gap);
    }
    .row-label {
      width: 24px;
      margin: 0 4px;
      text-align: center;
      font-size: 13px;
      color: #555;
    }
    .entrance {
      width: calc(4 * var(--seat) + 3 * var(--gap));
      flex: none;
    }
    .aisle {
      width: 72px;
      flex: none;
    }
    .seat,
    .couch {
      flex: none;
      box-sizing: border-box;
      height: var(--seat);
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 4px;
      font: 500 12px Roboto, sans-serif;
      color: #fff;
      cursor: pointer;
    }
    .seat {
      width: var(--seat);
    }
    .couch {
      width: calc(2 * var(--seat) + var(--gap));
      border-radius: 10px;
    }
    .seat[data-state='available'],
    .couch[data-state='available'],
    .swatch[data-state='available'] {
      background: #2e7d32;
    }
    .seat[data-state='selected'],
    .couch[data-state='selected'],
    .swatch[data-state='selected'] {
      background: #f9a825;
      color: #000;
    }
    .seat[data-state='unavailable'],
    .couch[data-state='unavailable'],
    .swatch[data-state='unavailable'] {
      background: #c62828;
      cursor: not-allowed;
    }
    .seat[data-state='accessible'],
    .swatch[data-state='accessible'] {
      background: #1565c0;
    }
    .legend {
      display: flex;
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
      border-radius: 3px;
      display: inline-block;
    }
    .selected-seats {
      margin-top: 20px;
      min-width: 260px;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
  `,
})
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly rows = buildRows();
  readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => new Set(this.booking.booking()?.seats ?? []));
  readonly seatCount = computed(() => this.booking.booking()?.seats.length ?? 0);

  readonly showDateText = computed(() => {
    const s = this.screening();
    return s ? showDate(s.date, s.time) : '';
  });

  readonly selectionLines = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const t of ticketsFromSeats(this.booking.booking()?.seats ?? [])) {
      const text = t.couch ? `${t.columnStart}-${t.columnEnd}` : `${t.columnStart}`;
      byRow.set(t.row, [...(byRow.get(t.row) ?? []), text]);
    }
    return [...byRow.entries()].map(([row, parts]) => ({ row, text: parts.join(', ') }));
  });

  constructor() {
    if (!Number.isInteger(this.screeningId)) {
      this.router.navigateByUrl('/');
      return;
    }
    this.api
      .getScreening(this.screeningId)
      .pipe(
        switchMap((screening) => this.api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          const current = this.booking.booking();
          if (!current || current.paid || current.screeningId !== screening.id) {
            this.booking.start(screening.id);
          }
          this.movie.set(movie);
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  stateOf(cell: Cell): SeatState {
    if (cell.type !== 'seat' && cell.type !== 'couch') return 'available';
    const ids = cell.ticket.ids;
    const occupied = this.occupied();
    if (ids.some((id) => occupied.has(id))) return 'unavailable';
    const selected = this.selected();
    if (ids.every((id) => selected.has(id))) return 'selected';
    return cell.type === 'seat' && cell.accessible ? 'accessible' : 'available';
  }

  toggle(ticket: Ticket): void {
    const occupied = this.occupied();
    if (ticket.ids.some((id) => occupied.has(id))) return;
    const current = this.booking.booking()?.seats ?? [];
    if (ticket.ids.every((id) => current.includes(id))) {
      this.booking.setSeats(current.filter((id) => !ticket.ids.includes(id)));
      return;
    }
    if (current.length + ticket.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.booking.setSeats([...current, ...ticket.ids]);
  }

  cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  next(): void {
    if (this.seatCount() === 0) return;
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
