import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { CinescopeApi, ScreeningWithMovie } from '../api';
import { BookingService } from '../booking/booking';
import { formatPrice, SeatUnit, unitsOf } from '../booking/units';

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  template: `
    @let data = view();
    @if (data) {
      <h1 data-testid="summary-title">Your tickets</h1>

      <div class="list" data-testid="summary-list">
        @for (unit of units(); track unit.key) {
          <div class="item" data-testid="summary-item">
            <span data-testid="summary-item-title">{{ data.movie.title }}</span>
            <span data-testid="summary-item-datetime"
              >{{ data.screening.date }} {{ data.screening.time }}</span
            >
            <span data-testid="summary-item-row">{{ unit.row }}</span>
            <span data-testid="summary-item-seat">{{ describe(unit) }}</span>
            <span data-testid="summary-item-price">{{ price(unit) }}</span>
            <button
              mat-stroked-button
              data-testid="summary-item-remove-button"
              (click)="remove(unit)"
            >
              Remove
            </button>
          </div>
        }
      </div>

      <p class="total" data-testid="summary-total">Total: {{ total() }}</p>

      <div class="actions">
        <button mat-stroked-button data-testid="back-button" (click)="back()">Back</button>
        <button mat-flat-button color="primary" data-testid="confirm-button" (click)="confirm()">
          Confirm
        </button>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 720px;
      margin: 0 auto;
      padding: 24px;
      font-family: Roboto, 'Helvetica Neue', sans-serif;
    }

    h1 {
      margin: 0 0 16px;
      font-size: 28px;
    }

    .item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    [data-testid='summary-item-title'] {
      flex: 1;
      font-weight: 500;
    }

    .total {
      margin: 16px 0;
      text-align: right;
      font-size: 18px;
      font-weight: 500;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }
  `,
})
export class Summary {
  private readonly api = inject(CinescopeApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);

  private readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly view = toSignal<ScreeningWithMovie | undefined>(
    this.api.screeningWithMovie(this.screeningId).pipe(
      catchError(() => {
        void this.router.navigate(['/']);
        return EMPTY;
      }),
    ),
  );

  protected readonly units = computed(() => unitsOf(this.booking.booking()?.seats ?? []));

  protected readonly total = computed(() =>
    formatPrice(this.units().reduce((sum, unit) => sum + unit.price, 0)),
  );

  protected describe(unit: SeatUnit): string {
    return unit.couch ? `Couch ${unit.label}` : unit.label;
  }

  protected price(unit: SeatUnit): string {
    return formatPrice(unit.price);
  }

  protected remove(unit: SeatUnit): void {
    const remaining = (this.booking.booking()?.seats ?? []).filter((id) => !unit.ids.includes(id));
    this.booking.setSeats(remaining);
    if (remaining.length === 0) {
      void this.router.navigate(['/screenings', this.screeningId, 'seats']);
    }
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  protected confirm(): void {
    void this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
