import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, tap } from 'rxjs';
import { CinescopeApi, ScreeningWithMovie } from '../api';
import { BookingService, MAX_SEATS } from '../booking/booking';
import { seatId, unitsOf } from '../booking/units';
import { showDate } from '../dates';
import { ToastService } from '../toast/toast';
import { AuditoriumRow, buildAuditorium } from './auditorium';

interface LegendEntry {
  state: string;
  label: string;
}

interface SelectedLine {
  row: number;
  text: string;
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButton],
  template: `
    @let data = view();
    @if (data) {
      <h1 data-testid="seat-map-title">Choose your seats</h1>
      <p class="subtitle" data-testid="seat-map-subtitle">Show Date: {{ showDateText() }}</p>
      <p class="limit" data-testid="seat-limit-info">
        You can reserve up to 10 seats per reservation
      </p>

      <div class="screen" data-testid="screen-indicator">SCREEN</div>

      <div class="seat-map" data-testid="seat-map">
        @for (row of rows(); track row.row) {
          <div class="seat-row" data-testid="seat-row" [attr.data-row]="row.row">
            <span class="row-label" data-testid="row-label-left" [attr.data-row]="row.row">{{
              row.row
            }}</span>
            @for (item of row.items; track $index) {
              @if (item.kind === 'seat') {
                <button
                  type="button"
                  class="seat"
                  data-testid="seat"
                  [attr.data-row]="item.row"
                  [attr.data-column]="item.column"
                  [attr.data-state]="item.state"
                  [disabled]="item.state === 'unavailable'"
                  (click)="toggle([seatIdOf(item.row, item.column)])"
                >
                  {{ item.column }}
                </button>
              } @else if (item.kind === 'couch') {
                <button
                  type="button"
                  class="couch"
                  data-testid="couch"
                  [attr.data-row]="item.row"
                  [attr.data-column-start]="item.start"
                  [attr.data-column-end]="item.end"
                  [attr.data-state]="item.state"
                  [disabled]="item.state === 'unavailable'"
                  (click)="toggle([seatIdOf(item.row, item.start), seatIdOf(item.row, item.end)])"
                >
                  {{ item.start }}-{{ item.end }}
                </button>
              } @else if (item.kind === 'aisle') {
                <span class="aisle" data-testid="aisle" [attr.data-row]="item.row"></span>
              } @else {
                <span class="entrance"></span>
              }
            }
            <span class="row-label" data-testid="row-label-right" [attr.data-row]="row.row">{{
              row.row
            }}</span>
          </div>
        }
      </div>

      <div class="legend" data-testid="legend">
        @for (entry of legend; track entry.state) {
          <span class="legend-item" data-testid="legend-item" [attr.data-state]="entry.state">
            <span class="swatch"></span>{{ entry.label }}
          </span>
        }
      </div>

      <div class="selected-seats" data-testid="selected-seats">
        <p data-testid="selected-seats-count">Selected seats: {{ selectedCount() }}</p>
        @for (line of selectedLines(); track line.row) {
          <p data-testid="selected-seats-row" [attr.data-row]="line.row">
            Row {{ line.row }}: {{ line.text }}
          </p>
        }
      </div>

      <div class="actions">
        <button mat-stroked-button data-testid="cancel-button" (click)="cancel()">Cancel</button>
        <button
          mat-flat-button
          color="primary"
          data-testid="continue-button"
          [disabled]="selectedCount() === 0"
          (click)="continueToSummary()"
        >
          Continue
        </button>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      text-align: center;
      font-family: Roboto, 'Helvetica Neue', sans-serif;
    }

    h1 {
      margin: 0 0 4px;
      font-size: 28px;
    }

    .subtitle {
      margin: 0 0 8px;
    }

    .limit {
      margin: 0 0 16px;
    }

    .screen {
      width: 60%;
      margin: 0 auto 24px;
      padding: 6px 0;
      background: #e0e0e0;
      border-radius: 0 0 50% 50% / 0 0 20px 20px;
      letter-spacing: 6px;
      font-weight: 500;
    }

    .seat-map {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .seat-row {
      display: flex;
      align-items: center;
    }

    .row-label {
      width: 32px;
      font-size: 13px;
    }

    .seat,
    .couch {
      height: 28px;
      margin: 0 2px;
      padding: 0;
      border: 0;
      border-radius: 4px;
      color: #fff;
      font-size: 11px;
      cursor: pointer;
    }

    .seat {
      width: 28px;
    }

    .couch {
      width: 60px;
    }

    .seat:disabled,
    .couch:disabled {
      cursor: not-allowed;
    }

    .seat[data-state='available'],
    .couch[data-state='available'],
    .legend-item[data-state='available'] .swatch {
      background: #2e7d32;
    }

    .seat[data-state='selected'],
    .couch[data-state='selected'],
    .legend-item[data-state='selected'] .swatch {
      background: #f9a825;
      color: #212121;
    }

    .seat[data-state='unavailable'],
    .couch[data-state='unavailable'],
    .legend-item[data-state='unavailable'] .swatch {
      background: #c62828;
    }

    .seat[data-state='accessible'],
    .legend-item[data-state='accessible'] .swatch {
      background: #1565c0;
    }

    .aisle {
      width: 64px;
      flex: none;
    }

    .entrance {
      width: 128px;
      flex: none;
    }

    .legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin: 24px 0 16px;
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .swatch {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }

    .selected-seats {
      margin-bottom: 16px;
    }

    .selected-seats p {
      margin: 4px 0;
    }

    .actions {
      display: flex;
      justify-content: center;
      gap: 16px;
    }
  `,
})
export class SeatSelection {
  private readonly api = inject(CinescopeApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly legend: LegendEntry[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  protected readonly view = toSignal<ScreeningWithMovie | undefined>(
    this.api.screeningWithMovie(this.screeningId).pipe(
      tap(() => this.booking.startFor(this.screeningId)),
      catchError(() => {
        void this.router.navigate(['/']);
        return EMPTY;
      }),
    ),
  );

  private readonly selectedIds = computed(() => this.booking.booking()?.seats ?? []);

  protected readonly selectedCount = computed(() => this.selectedIds().length);

  protected readonly showDateText = computed(() => {
    const data = this.view();
    return data ? showDate(data.screening.date, data.screening.time) : '';
  });

  protected readonly rows = computed<AuditoriumRow[]>(() => {
    const data = this.view();
    if (!data) {
      return [];
    }
    return buildAuditorium(new Set(data.screening.occupiedSeats), new Set(this.selectedIds()));
  });

  protected readonly selectedLines = computed<SelectedLine[]>(() => {
    const lines: SelectedLine[] = [];
    for (const unit of unitsOf(this.selectedIds())) {
      const last = lines.at(-1);
      if (last?.row === unit.row) {
        last.text += `, ${unit.label}`;
      } else {
        lines.push({ row: unit.row, text: unit.label });
      }
    }
    return lines;
  });

  protected seatIdOf(row: number, column: number): string {
    return seatId(row, column);
  }

  protected toggle(ids: string[]): void {
    const selected = this.selectedIds();
    if (ids.every((id) => selected.includes(id))) {
      this.booking.setSeats(selected.filter((id) => !ids.includes(id)));
      return;
    }
    if (selected.length + ids.length > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    }
    this.booking.setSeats([...selected, ...ids]);
  }

  protected cancel(): void {
    this.booking.clear();
    void this.router.navigate(['/']);
  }

  protected continueToSummary(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    void this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}
