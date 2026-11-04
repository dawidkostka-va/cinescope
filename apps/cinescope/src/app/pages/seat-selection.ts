import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingStore } from '../core/booking';
import { Api } from '../core/api';
import { showDate } from '../core/dates';
import { Screening } from '../core/models';
import { Cell, LAYOUT, MAX_SEATS, SeatState, cellState, itemLabel, ticketItems } from '../core/seats';
import { ToastService } from '../core/toast';

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
      <main class="page">
        <h1 data-testid="seat-map-title">Choose your seats</h1>
        <p class="subtitle" data-testid="seat-map-subtitle">Show Date: {{ showDateText() }}</p>

        <div class="auditorium">
          <p class="limit" data-testid="seat-limit-info">You can reserve up to 10 seats per reservation</p>
          <div class="screen" data-testid="screen-indicator">SCREEN</div>
          <div class="seat-map" data-testid="seat-map">
            @for (row of layout; track row.row) {
              <div class="row" data-testid="seat-row" [attr.data-row]="row.row">
                <span class="label" data-testid="row-label-left" [attr.data-row]="row.row">{{ row.row }}</span>
                <div class="block left">
                  @for (cell of row.left; track cell.ids[0]) {
                    <ng-container [ngTemplateOutlet]="cellTpl" [ngTemplateOutletContext]="{ $implicit: cell }" />
                  }
                </div>
                <div class="aisle" data-testid="aisle" [attr.data-row]="row.row"></div>
                <div class="block middle">
                  @for (cell of row.middle; track cell.ids[0]) {
                    <ng-container [ngTemplateOutlet]="cellTpl" [ngTemplateOutletContext]="{ $implicit: cell }" />
                  }
                </div>
                <div class="aisle" data-testid="aisle" [attr.data-row]="row.row"></div>
                <div class="block right">
                  @for (cell of row.right; track cell.ids[0]) {
                    <ng-container [ngTemplateOutlet]="cellTpl" [ngTemplateOutletContext]="{ $implicit: cell }" />
                  }
                </div>
                <span class="label" data-testid="row-label-right" [attr.data-row]="row.row">{{ row.row }}</span>
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

        <div class="selected-panel" data-testid="selected-seats">
          <div data-testid="selected-seats-count">Selected seats: {{ store.seats().length }}</div>
          @for (line of selectedLines(); track line.row) {
            <div data-testid="selected-seats-row" [attr.data-row]="line.row">Row {{ line.row }}: {{ line.text }}</div>
          }
        </div>

        <div class="actions">
          <button matButton="outlined" data-testid="cancel-button" (click)="cancel()">Cancel</button>
          <button
            matButton="filled"
            data-testid="continue-button"
            [disabled]="store.seats().length === 0"
            (click)="next()"
          >
            Continue
          </button>
        </div>
      </main>
    }

    <ng-template #cellTpl let-cell>
      @if (cell.kind === 'seat') {
        <button
          type="button"
          class="seat"
          data-testid="seat"
          [attr.data-row]="cell.row"
          [attr.data-column]="cell.column"
          [attr.data-state]="stateOf(cell)"
          [attr.aria-disabled]="stateOf(cell) === 'unavailable'"
          (click)="toggle(cell)"
        >
          {{ cell.column }}
        </button>
      } @else {
        <button
          type="button"
          class="seat couch"
          data-testid="couch"
          [attr.data-row]="cell.row"
          [attr.data-column-start]="cell.columnStart"
          [attr.data-column-end]="cell.columnEnd"
          [attr.data-state]="stateOf(cell)"
          [attr.aria-disabled]="stateOf(cell) === 'unavailable'"
          (click)="toggle(cell)"
        >
          {{ cell.columnStart }}-{{ cell.columnEnd }}
        </button>
      }
    </ng-template>
  `,
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly store = inject(BookingStore);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly layout = LAYOUT;
  protected readonly legend = LEGEND;
  protected readonly screening = signal<Screening | null>(null);

  protected readonly showDateText = computed(() => {
    const s = this.screening();
    return s ? showDate(s.date, s.time) : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => new Set(this.store.seats()));

  protected readonly selectedLines = computed(() => {
    const lines = new Map<number, string[]>();
    for (const item of ticketItems(this.store.seats())) {
      lines.set(item.row, [...(lines.get(item.row) ?? []), itemLabel(item)]);
    }
    return [...lines].map(([row, parts]) => ({ row, text: parts.join(', ') }));
  });

  constructor() {
    this.api.screeningWithMovie(this.screeningId).subscribe({
      next: ({ screening }) => {
        if (!this.store.isInProgressFor(screening.id)) {
          this.store.start(screening.id);
        }
        this.screening.set(screening);
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  protected stateOf(cell: Cell): SeatState {
    return cellState(cell, this.selected(), this.occupied());
  }

  protected toggle(cell: Cell): void {
    const state = this.stateOf(cell);
    if (state === 'unavailable') return;
    const current = this.store.seats();
    if (state === 'selected') {
      this.store.setSeats(current.filter((id) => !cell.ids.includes(id)));
    } else if (current.length + cell.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.store.setSeats([...current, ...cell.ids]);
    }
  }

  protected cancel(): void {
    this.store.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    if (this.store.seats().length > 0) {
      this.router.navigate(['/screenings', this.screeningId, 'summary']);
    }
  }
}
