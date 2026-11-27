import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { Api } from '../api.service';
import { BookingService } from '../booking.service';
import { Movie, Screening } from '../models';
import { TicketItem, formatPrice } from '../seat-utils';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  template: `
    @if (data(); as d) {
      <div class="page">
        <h1 data-testid="summary-title">Your tickets</h1>
        <ul class="list" data-testid="summary-list">
          @for (item of bookingService.items(); track item.ids[0]) {
            <li class="item" data-testid="summary-item">
              <span data-testid="summary-item-title">{{ d.movie.title }}</span>
              <span data-testid="summary-item-datetime"
                >{{ d.screening.date }} {{ d.screening.time }}</span
              >
              <span
                >Row <span data-testid="summary-item-row">{{ item.row }}</span></span
              >
              <span
                >Seat <span data-testid="summary-item-seat">{{ seatText(item) }}</span></span
              >
              <span data-testid="summary-item-price">{{ price(item.price) }}</span>
              <button
                mat-stroked-button
                type="button"
                data-testid="summary-item-remove-button"
                (click)="remove(item)"
              >Remove</button>
            </li>
          }
        </ul>
        <p class="total" data-testid="summary-total">Total: {{ total() }} PLN</p>
        <div class="button-row">
          <button mat-stroked-button type="button" data-testid="back-button" (click)="go('seats')">Back</button>
          <button
            mat-flat-button
            type="button"
            data-testid="confirm-button"
            (click)="go('checkout')"
          >Confirm</button>
        </div>
      </div>
    }
  `,
  styles: `
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 12px 0;
      border-bottom: 1px solid #ddd;
    }
    .item > :first-child {
      flex: 1;
    }
    .total {
      font-weight: 500;
      font-size: 18px;
    }
  `,
})
export class Summary {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly bookingService = inject(BookingService);

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly total = computed(() => this.bookingService.total().toFixed(2));
  private readonly screeningId = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.api
      .screening(this.screeningId)
      .pipe(
        switchMap((screening) =>
          forkJoin({ screening: [screening], movie: this.api.movie(screening.movieId) }),
        ),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected price(amount: number): string {
    return formatPrice(amount);
  }

  protected seatText(item: TicketItem): string {
    return item.couch ? `Couch ${item.colStart}-${item.colEnd}` : String(item.colStart);
  }

  protected remove(item: TicketItem): void {
    const seats = this.bookingService.booking()?.seats ?? [];
    this.bookingService.setSeats(seats.filter((id) => !item.ids.includes(id)));
    if (this.bookingService.items().length === 0) this.go('seats');
  }

  protected go(target: 'seats' | 'checkout'): void {
    this.router.navigate(['/screenings', this.screeningId, target]);
  }
}
