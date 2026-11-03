import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { showDate } from '../core/dates';
import { Screening } from '../core/models';
import { AUDITORIUM, SeatItem, describeItem } from '../core/seat-layout';
import { ToastService } from '../core/toast.service';

type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-selection',
  imports: [MatButton, NgTemplateOutlet],
  template: `
    @if (screening(); as s) {
      <div class="page">
        <h1 data-testid="seat-map-title">Choose your seats</h1>
        <p class="subtitle" data-testid="seat-map-subtitle">Show Date: {{ showDateText() }}</p>

        <div class="auditorium">
          <p class="limit" data-testid="seat-limit-info">You can reserve up to 10 seats per reservation</p>
          <div class="screen" data-testid="screen-indicator">SCREEN</div>
          <div class="seat-map" data-testid="seat-map">
            @for (row of rows; track row.row) {
              <div class="row" data-testid="seat-row" [attr.data-row]="row.row">
                <span class="label" data-testid="row-label-left" [attr.data-row]="row.row">{{ row.row }}</span>
                @if (row.entrance) {
                  <div class="block entrance"></div>
                } @else {
                  <div class="block">
                    <ng-container *ngTemplateOutlet="items; context: { $implicit: row.left }" />
                  </div>
                }
                <div class="aisle" data-testid="aisle" [attr.data-row]="row.row"></div>
                <div class="block">
                  <ng-container *ngTemplateOutlet="items; context: { $implicit: row.middle }" />
                </div>
                <div class="aisle" data-testid="aisle" [attr.data-row]="row.row"></div>
                <div class="block">
                  <ng-container *ngTemplateOutlet="items; context: { $implicit: row.right }" />
                </div>
                <span class="label" data-testid="row-label-right" [attr.data-row]="row.row">{{ row.row }}</span>
              </div>
            }
          </div>

          <div class="legend" data-testid="legend">
            @for (entry of legend; track entry.state) {
              <div class="legend-item" data-testid="legend-item" [attr.data-state]="entry.state">
                <span class="swatch"></span>{{ entry.label }}
              </div>
            }
          </div>
        </div>

        <div class="selected-seats" data-testid="selected-seats">
          <div data-testid="selected-seats-count">Selected seats: {{ booking.seatCount() }}</div>
          @for (line of lines(); track line.row) {
            <div data-testid="selected-seats-row" [attr.data-row]="line.row">Row {{ line.row }}: {{ line.text }}</div>
          }
        </div>

        <div class="actions">
          <button matButton="outlined" data-testid="cancel-button" (click)="cancel()">Cancel</button>
          <button
            matButton="filled"
            data-testid="continue-button"
            [disabled]="booking.seatCount() === 0"
            (click)="continue(s.id)"
          >
            Continue
          </button>
        </div>
      </div>
    }

    <ng-template #items let-list>
      @for (item of list; track item.key) {
        @if (item.couch) {
          <div
            class="couch"
            data-testid="couch"
            [attr.data-row]="item.row"
            [attr.data-column-start]="item.colStart"
            [attr.data-column-end]="item.colEnd"
            [attr.data-state]="stateOf(item)"
            tabindex="0"
            (click)="toggle(item)"
            (keydown.enter)="toggle(item)"
          >
            {{ item.colStart }}-{{ item.colEnd }}
          </div>
        } @else {
          <div
            class="seat"
            data-testid="seat"
            [attr.data-row]="item.row"
            [attr.data-column]="item.colStart"
            [attr.data-state]="stateOf(item)"
            tabindex="0"
            (click)="toggle(item)"
            (keydown.enter)="toggle(item)"
          >
            {{ item.colStart }}
          </div>
        }
      }
    </ng-template>
  `,
  styles: `
    :host {
      --available: #2e7d32;
      --selected: #f9a825;
      --unavailable: #c62828;
      --accessible: #1565c0;
    }
    h1,
    .subtitle {
      text-align: center;
      margin: 0 0 8px;
    }
    .auditorium {
      width: max-content;
      margin: 16px auto 0;
    }
    .limit {
      text-align: center;
      margin: 0 0 12px;
    }
    .screen {
      background: #424242;
      color: #fff;
      text-align: center;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 16px;
      letter-spacing: 8px;
    }
    .row {
      display: flex;
      align-items: center;
      height: 36px;
    }
    .label {
      width: 32px;
      text-align: center;
      font-weight: 500;
    }
    .block {
      display: flex;
    }
    .block.entrance {
      width: 144px;
    }
    .aisle {
      width: 72px;
      flex: none;
    }
    .seat,
    .couch {
      box-sizing: border-box;
      height: 32px;
      margin: 0 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
      user-select: none;
      flex: none;
    }
    .seat {
      width: 32px;
    }
    .couch {
      width: 68px;
      border-radius: 12px;
      font-weight: 500;
    }
    .seat[data-state='available'],
    .couch[data-state='available'] {
      background-color: var(--available);
    }
    .seat[data-state='selected'],
    .couch[data-state='selected'] {
      background-color: var(--selected);
      color: #212121;
    }
    .seat[data-state='unavailable'],
    .couch[data-state='unavailable'] {
      background-color: var(--unavailable);
    }
    .seat[data-state='accessible'],
    .couch[data-state='accessible'] {
      background-color: var(--accessible);
    }
    .seat[data-state='available'],
    .seat[data-state='selected'],
    .seat[data-state='accessible'],
    .couch[data-state='available'],
    .couch[data-state='selected'] {
      cursor: pointer;
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
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }
    .legend-item[data-state='available'] .swatch {
      background-color: var(--available);
    }
    .legend-item[data-state='selected'] .swatch {
      background-color: var(--selected);
    }
    .legend-item[data-state='unavailable'] .swatch {
      background-color: var(--unavailable);
    }
    .legend-item[data-state='accessible'] .swatch {
      background-color: var(--accessible);
    }
    .selected-seats {
      width: max-content;
      margin: 24px auto 0;
      min-width: 240px;
    }
    .actions {
      justify-content: center;
    }
  `,
})
export class SeatSelection {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  protected readonly booking = inject(BookingService);

  protected readonly rows = AUDITORIUM;
  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);

  protected readonly showDateText = computed(() => {
    const s = this.screening();
    return s ? showDate(s.date, s.time) : '';
  });
  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));

  protected readonly lines = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of this.booking.items()) {
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), describeItem(item)]);
    }
    return [...byRow].map(([row, parts]) => ({ row, text: parts.join(', ') }));
  });

  constructor() {
    this.api
      .screening(this.route.snapshot.paramMap.get('id') ?? '')
      .pipe(
        switchMap((screening) => this.api.movie(screening.movieId).pipe(map(() => screening))),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (screening) => {
          this.booking.open(screening.id);
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected stateOf(item: SeatItem): SeatState {
    if (item.ids.some((id) => this.occupied().has(id))) return 'unavailable';
    if (this.booking.isSelected(item)) return 'selected';
    return item.accessible ? 'accessible' : 'available';
  }

  protected toggle(item: SeatItem): void {
    if (this.stateOf(item) === 'unavailable') return;
    if (this.booking.toggle(item) === 'limit') this.toast.show('Maximum 10 seats per booking');
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected continue(id: number): void {
    if (this.booking.seatCount() > 0) this.router.navigate(['/screenings', id, 'summary']);
  }
}
