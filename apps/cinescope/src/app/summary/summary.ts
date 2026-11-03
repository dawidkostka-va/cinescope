import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { SeatItem, formatPrice } from '../core/seat-layout';

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  template: `
    @if (data(); as d) {
      <div class="page">
        <h1 data-testid="summary-title">Your tickets</h1>
        <ul class="list" data-testid="summary-list">
          @for (item of booking.items(); track item.key) {
            <li class="item" data-testid="summary-item">
              <span class="title" data-testid="summary-item-title">{{ d.movie.title }}</span>
              <span data-testid="summary-item-datetime">{{ d.screening.date }} {{ d.screening.time }}</span>
              <span class="cell">Row <span data-testid="summary-item-row">{{ item.row }}</span></span>
              <span class="cell">Seat <span data-testid="summary-item-seat">{{ seatText(item) }}</span></span>
              <span class="price" data-testid="summary-item-price">{{ price(item) }}</span>
              <button matButton="outlined" data-testid="summary-item-remove-button" (click)="remove(item)">
                Remove
              </button>
            </li>
          }
        </ul>
        <p class="total" data-testid="summary-total">Total: {{ totalText() }}</p>
        <div class="actions">
          <button matButton="outlined" data-testid="back-button" (click)="back()">Back</button>
          <button matButton="filled" data-testid="confirm-button" (click)="confirm()">Confirm</button>
        </div>
      </div>
    }
  `,
  styles: `
    .list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 24px;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 8px 16px;
    }
    .title {
      flex: 1;
      font-weight: 500;
    }
    .price {
      min-width: 90px;
      text-align: right;
    }
    .total {
      font-size: 20px;
      font-weight: 500;
    }
  `,
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  protected readonly booking = inject(BookingService);
  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);

  constructor() {
    this.api
      .screening(this.id)
      .pipe(
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected seatText(item: SeatItem): string {
    return item.couch ? `Couch ${item.colStart}-${item.colEnd}` : String(item.colStart);
  }

  protected price(item: SeatItem): string {
    return formatPrice(item.price);
  }

  protected totalText(): string {
    return formatPrice(this.booking.total());
  }

  protected remove(item: SeatItem): void {
    this.booking.remove(item);
    if (this.booking.seatCount() === 0) this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.id, 'checkout']);
  }
}
